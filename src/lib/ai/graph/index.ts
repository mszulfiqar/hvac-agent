import { END, START, StateGraph } from "@langchain/langgraph";

import { jevClassificationNode } from "@/lib/ai/nodes/jev-classification";
import { AgentState } from "./state";

export const speedToLeadGraph = new StateGraph(AgentState)
  .addNode("jev_classification", jevClassificationNode)
  .addEdge(START, "jev_classification")
  .addEdge("jev_classification", END)
  .compile();
