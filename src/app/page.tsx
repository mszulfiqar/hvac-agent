
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive, ArrowUpRight, Check, CheckCheck, CircleAlert,
  Clock3, Filter, Inbox, MapPin, MoreHorizontal, Paperclip,
  Phone, Plus, Search, Send, Settings2, ShieldCheck, Snowflake, Sparkles,
  UserRound, UserRoundCheck, Wrench, X,
} from "lucide-react";

type Owner = "AI" | "Human" | "Closed";
type LeadStatus = "New" | "Qualified" | "Needs attention" | "Booked" | "Closed";
type Sender = "customer" | "ai" | "dispatcher";

type Message = {
  id: string;
  sender: Sender;
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
  status: LeadStatus;
  owner: Owner;
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

const filters = [
  "All leads",
  "New",
  "AI handling",
  "Needs attention",
  "Booked",
  "Closed",
] as const;

type Filter = (typeof filters)[number];

const statusStyles: Record<LeadStatus, string> = {
  New: "border-sky-200 bg-sky-50 text-sky-700",
  Qualified: "border-violet-200 bg-violet-50 text-violet-700",
  "Needs attention": "border-amber-200 bg-amber-50 text-amber-800",
  Booked: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Closed: "border-slate-200 bg-slate-100 text-slate-600",
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function OwnerBadge({ owner }: { owner: Owner }) {
  const style =
    owner === "AI"
      ? "bg-violet-50 text-violet-700 border-violet-100"
      : owner === "Human"
        ? "bg-sky-50 text-sky-700 border-sky-100"
        : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${style}`}
    >
      {owner === "AI" ? (
        <Sparkles size={11} />
      ) : owner === "Human" ? (
        <UserRound size={11} />
      ) : (
        <Check size={11} />
      )}

      {owner === "AI"
        ? "AI handling"
        : owner === "Human"
          ? "Human handling"
          : "Closed"}
    </span>
  );
}

function Avatar({
  initials,
  large = false,
}: {
  initials: string;
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-sky-100 to-indigo-100 font-bold text-sky-800 shadow-sm ${
        large ? "h-11 w-11 text-sm" : "h-10 w-10 text-xs"
      }`}
    >
      {initials}
    </div>
  );
}

function formatRelativeTime(value: string | null): string {
  if (!value) return "No activity";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const today = new Date().toDateString();

  if (date.toDateString() === today) return time;

  return `${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}, ${time}`;
}

function formatUrgency(value: string): string {
  const normalized = value.trim().toUpperCase();

  switch (normalized) {
    case "HIGH":
    case "URGENT":
      return "Urgent";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return value || "Normal";
  }
}

function formatSource(value: string): string {
  switch (value) {
    case "WEB_FORM":
      return "Website";
    case "INBOUND_SMS":
      return "Inbound SMS";
    case "INBOUND_CALL":
      return "Phone";
    case "MANUAL":
      return "Manual";
    case "INTEGRATION":
      return "Integration";
    default:
      return value.replaceAll("_", " ");
  }
}

function MessageStatus({ message }: { message: Message }) {
  if (message.approvalStatus === "PENDING") {
    return (
      <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-amber-600">
        <Clock3 size={10} />
        Awaiting approval
      </div>
    );
  }

  if (message.approvalStatus === "REJECTED") {
    return (
      <div className="mt-1 flex items-center gap-1 text-[9px] text-rose-500">
        <X size={10} />
        Rejected
      </div>
    );
  }

  if (message.deliveryStatus === "FAILED") {
    return (
      <div className="mt-1 flex items-center gap-1 text-[9px] text-rose-500">
        <CircleAlert size={10} />
        Failed
      </div>
    );
  }

  if (message.deliveryStatus === "DELIVERED") {
    return (
      <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-600">
        <CheckCheck size={10} />
        Delivered
      </div>
    );
  }

  if (message.deliveryStatus === "SENT") {
    return (
      <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
        <Check size={10} />
        Sent
      </div>
    );
  }

  if (message.deliveryStatus === "QUEUED") {
    return (
      <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
        <Clock3 size={10} />
        Queued
      </div>
    );
  }

  return null;
}

export default function HvacConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All leads");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileList, setMobileList] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadConversations(signal?: AbortSignal) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      });

      const result =
        (await response.json()) as ConversationsResponse;

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load conversations.",
        );
      }

      if (!result.success || !Array.isArray(result.conversations)) {
        throw new Error("The server returned an invalid response.");
      }

      setConversations(result.conversations);

      setActiveId((currentId) => {
        if (
          currentId &&
          result.conversations.some((item) => item.id === currentId)
        ) {
          return currentId;
        }

        return result.conversations[0]?.id ?? null;
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Failed to load conversations:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading conversations.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
  void loadConversations();
}, []);

  const active = conversations.find(
    (item) => item.id === activeId,
  );

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();

    return conversations.filter((item) => {
      const matchesFilter =
        filter === "All leads" ||
        (filter === "New" && item.status === "New") ||
        (filter === "AI handling" && item.owner === "AI") ||
        (filter === "Needs attention" &&
          item.status === "Needs attention") ||
        (filter === "Booked" && item.status === "Booked") ||
        (filter === "Closed" && item.status === "Closed");

      const matchesSearch =
        !q ||
        `${item.name} ${item.phone} ${item.preview} ${item.service}`
          .toLowerCase()
          .includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [conversations, filter, search]);

  const counts: Record<Filter, number> = {
    "All leads": conversations.length,
    New: conversations.filter((c) => c.status === "New").length,
    "AI handling": conversations.filter((c) => c.owner === "AI").length,
    "Needs attention": conversations.filter(
      (c) => c.status === "Needs attention",
    ).length,
    Booked: conversations.filter((c) => c.status === "Booked").length,
    Closed: conversations.filter((c) => c.status === "Closed").length,
  };

  function updateConversation(
    id: string,
    patch: Partial<Conversation>,
  ) {
    setConversations((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  }

  function sendMessage() {
    const text = draft.trim();

    if (!text || !active || active.owner !== "Human") return;

    const now = new Date();

    const message: Message = {
      id: `local-${Date.now()}`,
      sender: "dispatcher",
      text,
      time: now.toISOString(),
      direction: "OUTBOUND",
      deliveryStatus: "QUEUED",
      approvalStatus: "NOT_REQUIRED",
    };

    setConversations((current) =>
      current.map((item) =>
        item.id === active.id
          ? {
              ...item,
              preview: text,
              updated: now.toISOString(),
              messages: [...item.messages, message],
            }
          : item,
      ),
    );

    setDraft("");
  }

  function toggleClose() {
    if (!active) return;

    if (active.owner === "Closed") {
      updateConversation(active.id, {
        owner: "Human",
        status: "Needs attention",
      });
    } else {
      updateConversation(active.id, {
        owner: "Closed",
        status: "Closed",
      });
    }
  }

  return (
    <main className="h-[calc(100dvh-7.5rem)] min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-[0_12px_45px_-28px_rgba(15,23,42,0.28)]">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">

        {/* Top workspace bar */}
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-md shadow-sky-200/60">
              <Snowflake size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
                  Conversations
                </h1>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  Live inbox
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Speed-to-Lead · Customer communication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[10px] font-semibold text-emerald-700">
                AI agent online
              </span>
            </div>

            <button
              aria-label="Settings"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings2 size={16} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white shadow">
              AK
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[218px_310px_minmax(0,1fr)]">

          {/* Navigation rail */}
          <aside className="hidden min-h-0 flex-col border-r border-slate-200 bg-slate-50/80 p-3 md:flex">
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-800">
                  Demo HVAC Services
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Service workspace
                </p>
              </div>

              <MoreHorizontal size={15} className="ml-auto shrink-0 text-slate-400" />
            </div>

            <button className="mb-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 text-[11px] font-semibold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800">
              <Plus size={14} />
              New conversation
            </button>

            <div className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Inbox views
            </div>

            <nav className="space-y-1">
              {filters.map((item) => {
                const selected = filter === item;

                const Icon =
                  item === "All leads"
                    ? Inbox
                    : item === "New"
                      ? Sparkles
                      : item === "AI handling"
                        ? Snowflake
                        : item === "Needs attention"
                          ? CircleAlert
                          : item === "Booked"
                            ? CheckCheck
                            : Archive;

                return (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`group flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[11px] transition ${
                      selected
                        ? "bg-white font-bold text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                        : "text-slate-500 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        size={14}
                        className={selected ? "text-sky-600" : "text-slate-400"}
                      />
                      {item}
                    </span>

                    <span
                      className={`min-w-5 rounded-md px-1.5 py-0.5 text-center text-[9px] tabular-nums ${
                        selected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {counts[item]}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-800">
                <ShieldCheck size={14} className="text-sky-600" />
                AI response protection
              </div>

              <p className="mt-1.5 text-[10px] leading-[1.55] text-slate-500">
                Staff takeover pauses AI replies for that conversation.
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                System operational
              </div>
            </div>
          </aside>

          {/* Conversation list */}
          <section
            className={`${mobileList ? "flex" : "hidden"} min-h-0 flex-col border-r border-slate-200 bg-white md:flex`}
          >
            <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900">
                    {filter}
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {visibleConversations.length} conversations
                  </p>
                </div>

                <button
                  aria-label="Filter conversations"
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                >
                  <Filter size={14} />
                </button>
              </div>

              <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 transition focus-within:border-sky-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-50">
                <Search size={14} className="shrink-0 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full bg-transparent text-[11px] outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={13} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Loading conversations...
                </div>
              )}

              {!loading && error && (
                <div className="p-5 text-center">
                  <CircleAlert size={22} className="mx-auto text-rose-500" />

                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Could not load conversations
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {error}
                  </p>

                  <button
                    onClick={() => void loadConversations()}
                    className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-semibold text-white hover:bg-slate-700"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading &&
                !error &&
                visibleConversations.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No conversations found.
                  </div>
                )}

              {!loading &&
                !error &&
                visibleConversations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveId(item.id);
                      setMobileList(false);
                      setDraft("");
                    }}
                    className={`relative w-full border-b border-slate-100 px-3.5 py-3.5 text-left transition ${
                      activeId === item.id
                        ? "bg-sky-50/70"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {activeId === item.id && (
                      <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-sky-500" />
                    )}

                    <div className="flex gap-2.5">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 text-[11px] font-bold text-slate-600 shadow-sm">
                          {item.initials}
                        </div>

                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                            item.owner === "AI"
                              ? "bg-violet-500"
                              : item.owner === "Human"
                                ? "bg-sky-500"
                                : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[11px] font-bold text-slate-800">
                            {item.name}
                          </p>

                          <span className="shrink-0 text-[9px] text-slate-400">
                            {formatRelativeTime(item.updated)}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {item.phone}
                        </p>

                        <p className="mt-1.5 truncate text-[10px] leading-4 text-slate-600">
                          {item.preview}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={item.status} />

                          {item.urgency === "Urgent" && (
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-600">
                              Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            <div className="shrink-0 border-t border-slate-100 px-4 py-2 text-[9px] text-slate-400">
              Showing {visibleConversations.length} of {conversations.length} leads
            </div>
          </section>

          {/* Active conversation */}
          <section
            className={`${mobileList ? "hidden" : "flex"} min-h-0 min-w-0 flex-col bg-white md:flex`}
          >
            {loading ? (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                Loading conversation...
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <CircleAlert size={24} className="text-rose-500" />

                <p className="text-xs font-semibold text-slate-700">
                  Unable to load your inbox
                </p>

                <button
                  onClick={() => void loadConversations()}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : active ? (
              <>
                <header className="flex min-h-[68px] shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 md:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      onClick={() => setMobileList(true)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowUpRight size={15} className="rotate-180" />
                    </button>

                    <Avatar initials={active.initials} large />

                    <div className="min-w-0">
                      <h2 className="truncate text-[13px] font-bold text-slate-900">
                        {active.name}
                      </h2>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <Phone size={10} />
                        {active.phone}
                        <span className="text-slate-300">·</span>
                        <span>Lead #{active.leadId.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {active.owner === "AI" ? (
                      <button
                        onClick={() =>
                          updateConversation(active.id, {
                            owner: "Human",
                            status: "Needs attention",
                          })
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-700"
                      >
                        <UserRoundCheck size={13} />
                        <span className="hidden sm:inline">Take over</span>
                        <span className="sm:hidden">Take over</span>
                      </button>
                    ) : active.owner === "Human" ? (
                      <button
                        onClick={() =>
                          updateConversation(active.id, {
                            owner: "AI",
                          })
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-[10px] font-bold text-violet-700 transition hover:bg-violet-100"
                      >
                        <Snowflake size={13} />
                        <span className="hidden sm:inline">Return to AI</span>
                      </button>
                    ) : null}

                    <button
                      onClick={toggleClose}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      {active.owner === "Closed" ? (
                        <>
                          <Check size={13} />
                          Reopen
                        </>
                      ) : (
                        <>
                          <Archive size={13} />
                          <span className="hidden sm:inline">Close</span>
                        </>
                      )}
                    </button>

                    <button
                      aria-label="More actions"
                      className="hidden rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 sm:block"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </header>

                {/* Compact lead context strip */}
                <div className="grid shrink-0 grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:grid-cols-4 md:px-5">
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Service
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold text-slate-700">
                      <Wrench size={11} className="text-sky-600" />
                      {active.service}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold text-slate-700">
                      <MapPin size={11} className="text-sky-600" />
                      {active.address}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Lead source
                    </p>

                    <p className="mt-1 truncate text-[10px] font-semibold text-slate-700">
                      {formatSource(active.source)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Urgency
                    </p>

                    <p
                      className={`mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold ${
                        active.urgency === "Urgent"
                          ? "text-rose-600"
                          : "text-slate-700"
                      }`}
                    >
                      <Clock3 size={11} />
                      {active.urgency}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 md:px-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge status={active.status} />
                    <OwnerBadge owner={active.owner} />
                  </div>

                  <span className="hidden truncate text-[9px] text-slate-400 sm:block">
                    {active.owner === "AI"
                      ? "AI assistant is managing this conversation"
                      : active.owner === "Human"
                        ? "Your team has control of this conversation"
                        : "This conversation is closed"}
                  </span>
                </div>

                {/* Message history */}
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50/80 via-white to-white px-4 py-5 md:px-6">
                  <div className="flex justify-center">
                    <span className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-[9px] font-semibold text-slate-400 shadow-sm">
                      Conversation history
                    </span>
                  </div>

                  {active.messages.map((message) => {
                    const customer = message.sender === "customer";
                    const ai = message.sender === "ai";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          customer ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`flex max-w-[88%] flex-col sm:max-w-[76%] ${
                            customer ? "items-start" : "items-end"
                          }`}
                        >
                          <div
                            className={`mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 ${
                              customer ? "" : "justify-end"
                            }`}
                          >
                            {customer ? (
                              active.name
                            ) : ai ? (
                              <>
                                <Sparkles size={10} className="text-violet-500" />
                                AI assistant
                              </>
                            ) : (
                              <>
                                <UserRound size={10} />
                                Service team
                              </>
                            )}

                            <span className="font-normal">
                              · {formatMessageTime(message.time)}
                            </span>
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-3 text-[11px] leading-[1.7] shadow-sm ${
                              customer
                                ? "rounded-tl-md border border-slate-200/80 bg-white text-slate-700"
                                : ai
                                  ? "rounded-tr-md border border-violet-100 bg-violet-50 text-slate-700"
                                  : "rounded-tr-md bg-slate-900 text-white"
                            }`}
                          >
                            {message.text}
                          </div>

                          {!customer && (
                            <MessageStatus message={message} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Composer */}
                <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 md:px-5">
                  {active.owner === "Closed" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-[10px] font-medium text-slate-500">
                      <Archive size={13} />
                      This conversation is closed. Reopen it to send a message.
                    </div>
                  ) : active.owner === "AI" ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-3">
                      <div className="flex min-w-0 items-center gap-2 text-[10px] text-violet-800">
                        <Sparkles size={14} className="shrink-0" />
                        <span className="truncate">
                          AI is replying to this customer. Take over to send a team message.
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          updateConversation(active.id, {
                            owner: "Human",
                            status: "Needs attention",
                          })
                        }
                        className="shrink-0 rounded-lg bg-violet-700 px-3 py-2 text-[9px] font-bold text-white hover:bg-violet-800"
                      >
                        Take over
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-50"
                    >
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        rows={2}
                        placeholder="Write a reply..."
                        className="max-h-24 min-h-[54px] w-full resize-none bg-transparent px-3.5 pt-3 text-[11px] leading-5 outline-none placeholder:text-slate-400"
                      />

                      <div className="flex items-center justify-between border-t border-slate-100 px-2.5 py-2">
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                          <button
                            type="button"
                            aria-label="Attach file"
                            className="rounded-lg p-1.5 hover:bg-slate-100"
                          >
                            <Paperclip size={13} />
                          </button>

                          <span>SMS reply · Enter to send</span>
                        </div>

                        <button
                          type="submit"
                          disabled={!draft.trim()}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[10px] font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Send size={11} />
                          Send
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[8px] text-slate-400">
                    <span>
                      Demo mode · Messages are not sent by SMS
                    </span>
                    <span>Customer communication</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                {conversations.length === 0
                  ? "No conversations yet."
                  : "Select a conversation to view messages."}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
