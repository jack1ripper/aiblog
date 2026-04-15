"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  content: string;
  link?: string | null;
}

interface ClosedEntry {
  id: string;
  closedAt: number;
}

const STORAGE_KEY = "closedBannerIds";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function SiteBanners({ banners }: { banners: Banner[] }) {
  const [mounted, setMounted] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const parsed: ClosedEntry[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const valid = parsed.filter((entry) => now - entry.closedAt < TWENTY_FOUR_HOURS);
      setHiddenIds(new Set(valid.map((entry) => entry.id)));
      if (valid.length !== parsed.length) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleClose = (id: string) => {
    setHiddenIds((prev) => new Set([...Array.from(prev), id]));
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: ClosedEntry[] = raw ? JSON.parse(raw) : [];
      const filtered = parsed.filter((entry) => entry.id !== id);
      filtered.push({ id, closedAt: Date.now() });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  };

  const visible = banners.filter((b) => !hiddenIds.has(b.id));

  if (!mounted || visible.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {visible.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            "relative border-b bg-muted px-4 py-2 text-sm text-foreground transition-all",
            "flex items-center justify-between gap-4"
          )}
        >
          <div className="flex-1">
            {banner.link ? (
              <a
                href={banner.link}
                className="underline underline-offset-2 hover:text-foreground/80"
                target="_blank"
                rel="noreferrer"
              >
                {banner.content}
              </a>
            ) : (
              <span>{banner.content}</span>
            )}
          </div>
          <button
            onClick={() => handleClose(banner.id)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="关闭通知"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
