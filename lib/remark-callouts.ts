import { visit } from "unist-util-visit";

const VALID_CALLOUTS = new Set(["note", "warning", "tip"]);

interface CalloutNode {
  type?: string;
  name?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
}

type VisitNode = Parameters<typeof visit>[0];

export function remarkCallouts() {
  return (tree: VisitNode) => {
    visit(tree, (node: VisitNode) => {
      const n = node as CalloutNode;
      if (n.type === "containerDirective" && n.name && VALID_CALLOUTS.has(n.name)) {
        const data = n.data || (n.data = {});
        data.hName = "div";
        data.hProperties = { "data-callout": n.name };
      }
    });
  };
}
