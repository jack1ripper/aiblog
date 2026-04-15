"use client";

import Link from "next/link";
import { useState } from "react";
import { Rss, Mail } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

const footerLinks = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
];

function GithubSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function TwitterSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getRssUrl() {
  if (typeof window === "undefined") return "/feed.xml";
  return `${window.location.origin}/feed.xml`;
}

export function SiteFooter() {
  const [showCopied, setShowCopied] = useState(false);

  async function handleCopyRss(e: React.MouseEvent) {
    e.preventDefault();
    const url = getRssUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-3xl">
          {/* Top section */}
          <div className="grid gap-10 sm:grid-cols-[1fr_auto]">
            {/* Brand */}
            <div className="space-y-3">
              <Link href="/" className="inline-block text-lg font-semibold tracking-tight">
                Dusk³
              </Link>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Script & Style — 记录前端开发与生活随笔。
              </p>
              <p className="text-xs text-muted-foreground/60">dusk3.com</p>
            </div>

            {/* Links + Social */}
            <div className="flex gap-12 sm:gap-16">
              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/80">
                  页面
                </p>
                <ul className="space-y-2">
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/80">
                  关注
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="GitHub"
                  >
                    <GithubSvg className="h-4 w-4" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Twitter"
                  >
                    <TwitterSvg className="h-4 w-4" />
                  </a>
                  <a
                    href="mailto:hello@example.com"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <button
                    onClick={handleCopyRss}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="RSS"
                  >
                    <Rss className="h-4 w-4" />
                  </button>
                </div>
                {showCopied && (
                  <p className="text-xs text-foreground">
                    已复制 RSS 地址，可粘贴到阅读器订阅
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-12 border-t border-border/50" />

          {/* Bottom section */}
          <div className="mt-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Dusk³
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>
    </footer>
  );
}
