import { visit } from "unist-util-visit";

const VALID_CALLOUTS = new Set(["note", "warning", "tip"]);

export function remarkCallouts() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type === "containerDirective" && VALID_CALLOUTS.has(node.name)) {
        const data = node.data || (node.data = {});
        data.hName = "div";
        data.hProperties = { "data-callout": node.name };
      }
    });
  };
}
