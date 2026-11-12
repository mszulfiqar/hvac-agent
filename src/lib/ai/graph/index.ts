import { END, START, StateGraph } from "@langchain/langgraph";

import { deepseekQualificationNode } from "@/lib/ai/nodes/deepseek-qualification";
import { jevClassificationNode } from "@/lib/ai/nodes/jev-classification";
import { loadContextNode } from "@/lib/ai/nodes/load-context";
import { persistQualificationNode } from "@/lib/ai/nodes/persist-qualification";
import { replyDraftNode } from "@/lib/ai/nodes/reply-draft";
import { AgentState } from "./state";

export const speedToLeadGraph = new StateGraph(AgentState)
  .addNode("load_context", loadContextNode)
  .addNode("jev_classification", jevClassificationNode)
  .addNode("deepseek_qualification", deepseekQualificationNode)
  .addNode("reply_draft", replyDraftNode)
  .addNode("persist_qualification", persistQualificationNode)
  .addEdge(START, "load_context")
  .addConditionalEdges("load_context", (state) =>
    state.disposition === "continue" ? "jev_classification" : END,
  )
  .addConditionalEdges("jev_classification", (state) =>
    state.disposition === "continue"
      ? "deepseek_qualification"
      : "persist_qualification",
  )
  .addEdge("deepseek_qualification", "reply_draft")
  .addEdge("reply_draft", "persist_qualification")
  .addEdge("persist_qualification", END)
  .compile();
