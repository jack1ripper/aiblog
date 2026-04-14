"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
}

const IsInPreContext = createContext(false);

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "absolute right-3 top-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border bg-muted text-foreground shadow-sm transition-all duration-150",
        "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      )}
      aria-label={copied ? "已复制" : "复制代码"}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const codeStyle = resolvedTheme === "dark" ? vscDarkPlus : oneLight;

  const getHeadingId = (text: React.ReactNode) => {
    const plain = React.Children.toArray(text)
      .map((child) => (typeof child === "string" ? child : ""))
      .join("");
    return plain
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
  };

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2({ children, ...props }: any) {
            const id = getHeadingId(children);
            return (
              <h2 id={id} className="scroll-mt-24" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }: any) {
            const id = getHeadingId(children);
            return (
              <h3 id={id} className="scroll-mt-24" {...props}>
                {children}
              </h3>
            );
          },
          pre({ children }: any) {
            return (
              <IsInPreContext.Provider value={true}>
                <div className="relative">{children}</div>
              </IsInPreContext.Provider>
            );
          },
          code({ className, children, ...props }: any) {
            const isInPre = useContext(IsInPreContext);
            const codeString = String(children).replace(/\n$/, "");

            if (isInPre) {
              const match = /language-(\w+)/.exec(className || "");
              if (!mounted) {
                return (
                  <div className="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
                    <code>{codeString}</code>
                  </div>
                );
              }
              return (
                <>
                  <SyntaxHighlighter
                    style={codeStyle}
                    language={match?.[1] || "text"}
                    PreTag="div"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                  <CopyButton code={codeString} />
                </>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
