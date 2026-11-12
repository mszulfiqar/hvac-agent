
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Message = {
    id: string;
    sender: "customer" | "ai" | "dispatcher";
    text: string;
    time: string;
    deliveryStatus?: string;
    approvalStatus?: string;
    direction?: string;
};

type Conversation = {
    id: string;
    leadId: string;
    customerId: string;
    name: string;
    phone: string;
    initials: string;
    preview: string;
    updated: string | null;
    status: string;
    owner: string;
    service: string;
    address: string;
    urgency: string;
    source: string;
    channel: string;
    messages: Message[];
};

type ConversationsResponse = {
    success: boolean;
    conversations: Conversation[];
    error?: string;
};

type SimulationResponse = {
    success?: boolean;
    message?: string;
    duplicate?: boolean;
    messageId?: string;
    conversationId?: string;
    error?: string;
};

function formatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function TestingPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [message, setMessage] = useState("");


    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const activeConversation =
        conversations.find((item) => item.id === activeId) ?? null;

    const loadConversations = useCallback(async () => {
        setError(null);

        try {
            const response = await fetch("/api/conversations", {
                method: "GET",
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            const data = (await response.json()) as ConversationsResponse;

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Could not load conversations.");
            }

            setConversations(data.conversations);

            setActiveId((currentId) => {
                if (
                    currentId &&
                    data.conversations.some((item) => item.id === currentId)
                ) {
                    return currentId;
                }

                return data.conversations[0]?.id ?? null;
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong loading conversations.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    async function sendSimulatedCustomerMessage(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!activeConversation || !message.trim()) return;

        setSending(true);
        setError(null);
        setSuccessMessage(null);

        const payload = {
            data: {
                event_type: "message.received",
                id: `sim-event-${crypto.randomUUID()}`,
                payload: {
                    id: `sim-message-${crypto.randomUUID()}`,
                    from: {
                        phone_number: activeConversation.phone,
                    },
                    to: [
                        {
                            phone_number: "+15555550100",
                        },
                    ],
                    text: message.trim(),
                },
            },
        };

        try {
            const response = await fetch("/api/webhooks/telnyx/simulate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = (await response.json()) as SimulationResponse;

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.message || "Message simulation failed.");
            }

            setMessage("");

            setSuccessMessage(
                data.duplicate
                    ? "This message was already processed."
                    : "Customer message received and saved.",
            );

            await loadConversations();

            if (data.conversationId) {
                setActiveId(data.conversationId);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred.",
            );
        } finally {
            setSending(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        HVAC Platform / Development
                    </p>
                    <h1 className="text-xl font-bold">Conversation</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => void loadConversations()}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                        Refresh
                    </button>

                    <Link
                        href="/"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                        Dispatcher Workspace
                    </Link>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-5 p-4 lg:flex-row lg:p-6">
                {/* Conversation inbox */}
                <aside className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:w-80 lg:shrink-0">
                    <div className="border-b border-slate-200 p-4">
                        <h2 className="font-semibold">Conversations</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {conversations.length} conversations
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading && conversations.length === 0 ? (
                            <p className="p-5 text-sm text-slate-500">
                                Loading conversations...
                            </p>
                        ) : conversations.length === 0 ? (
                            <div className="p-5 text-sm text-slate-500">
                                No conversations found. Run the database seed or receive a
                                simulated message first.
                            </div>
                        ) : (
                            conversations.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveId(item.id);
                                        setSuccessMessage(null);
                                        setError(null);
                                    }}
                                    className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${activeId === item.id ? "bg-blue-50" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold">
                                            {item.initials}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold">
                                                    {item.name}
                                                </p>
                                                <span className="shrink-0 text-xs text-slate-400">
                                                    {item.updated ? formatTime(item.updated) : ""}
                                                </span>
                                            </div>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {item.preview}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Conversation window */}
                <section className="flex min-h-[650px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {activeConversation ? (
                        <>
                            {/* Customer header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                        {activeConversation.initials}
                                    </div>

                                    <div>
                                        <h2 className="font-semibold">
                                            {activeConversation.name}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            {activeConversation.phone}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right text-xs">
                                    <p className="font-medium text-slate-700">
                                        {activeConversation.service}
                                    </p>
                                    <p className="mt-1 text-slate-500">
                                        {activeConversation.owner} handling
                                    </p>
                                </div>
                            </div>

                            {/* Customer details */}
                            <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                <span>
                                    <strong>Status:</strong> {activeConversation.status}
                                </span>
                                <span>
                                    <strong>Channel:</strong> {activeConversation.channel}
                                </span>
                                <span>
                                    <strong>Urgency:</strong> {activeConversation.urgency || "Unknown"}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-slate-50 p-4">
                                {activeConversation.messages.length === 0 ? (
                                    <p className="m-auto text-sm text-slate-400">
                                        No messages in this conversation yet.
                                    </p>
                                ) : (
                                    activeConversation.messages.map((item) => {
                                        const isCustomer = item.sender === "customer";
                                        const isAi = item.sender === "ai";

                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex ${isCustomer ? "justify-start" : "justify-end"
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${isCustomer
                                                            ? "rounded-bl-sm border border-slate-200 bg-white"
                                                            : isAi
                                                                ? "rounded-br-sm bg-blue-600 text-white"
                                                                : "rounded-br-sm bg-slate-800 text-white"
                                                        }`}
                                                >
                                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                                                        <span
                                                            className={`text-xs font-semibold ${isCustomer ? "text-slate-500" : "text-white/80"
                                                                }`}
                                                        >
                                                            {isCustomer
                                                                ? activeConversation.name
                                                                : isAi
                                                                    ? "AI Assistant"
                                                                    : "Dispatcher"}
                                                        </span>

                                                        <span
                                                            className={`text-[10px] ${isCustomer ? "text-slate-400" : "text-white/70"
                                                                }`}
                                                        >
                                                            {formatTime(item.time)}
                                                        </span>
                                                    </div>

                                                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                        {item.text}
                                                    </p>

                                                    {!isCustomer && (
                                                        <p className="mt-2 text-[10px] text-white/70">
                                                            {item.approvalStatus === "PENDING"
                                                                ? "Awaiting approval · Not sent"
                                                                : item.deliveryStatus || ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Message composer */}
                            <div className="border-t border-slate-200 bg-white p-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Simulate customer reply
                                    </p>
                                    <span className="text-xs text-slate-400">
                                        No real SMS will be sent
                                    </span>
                                </div>

                                <form onSubmit={sendSimulatedCustomerMessage}>
                                    
                                    <textarea
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        rows={3}
                                        required
                                        placeholder="Type the next customer message..."
                                        className="w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs text-slate-400">
                                            From: {activeConversation.phone}
                                        </p>

                                        <button
                                            type="submit"
                                            disabled={sending || !message.trim()}
                                         className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {sending ? "Sending..." : "Send Customer Message"}
                                        </button>
                                    </div>
                                </form>

                                {successMessage && (
                                    <p className="mt-3 text-sm text-green-700">
                                        {successMessage}
                                    </p>
                                )}

                                {error && (
                                    <p className="mt-3 text-sm text-red-600">{error}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center p-8 text-center">
                            <div>
                                <h2 className="font-semibold">No conversation selected</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Select a conversation from the inbox to start testing.
                                </p>
                                {error && (
                                    <p className="mt-3 text-sm text-red-600">{error}</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
