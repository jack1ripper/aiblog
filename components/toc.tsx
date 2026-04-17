"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  items?: TocItem[];
}

export function Toc({ items }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [headings, setHeadings] = useState<TocItem[]>(items || []);

  useEffect(() => {
    if (items && items.length > 0) return;
    queueMicrotask(() => {
      const elements = Array.from(document.querySelectorAll("article h2, article h3"));
      const parsed = elements.map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      }));
      setHeadings(parsed);
    });
  }, [items]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-10% 0px -60% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        目录
      </p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((item, idx) => (
          <li
            key={`${item.id || "toc"}-${idx}`}
            className={cn(
              "relative pl-3 transition-colors",
              item.level === 3 && "pl-6"
            )}
          >
            {activeId === item.id && (
              <span className="absolute -left-px top-0 h-full w-px bg-primary transition-all duration-200" />
            )}
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "block py-1 text-sm leading-relaxed transition-colors duration-150",
                activeId === item.id
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
