# Speed-to-Lead LangGraph

The graph currently contains the first production workflow node:

1. Jev System One classifies each genuine inbound customer message.
2. Later nodes will use the classification to route spam, qualify valid leads with DeepSeek, score leads, and draft replies.

The graph is deliberately not connected to Inngest yet. We will add the remaining nodes and persistence/ownership checks before enabling the workflow for inbound traffic.

## Initial graph input

- `companyId`
- `leadId`
- `conversationId`
- `messageId`
- `inboundText`

## Initial graph output

- `classification`: Jev's structured classification result.
