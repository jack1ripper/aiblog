"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, Code2, Rss } from "lucide-react";
import { SearchDialog } from "@/components/search-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
];

const isDev = process.env.NODE_ENV === "development";

function getRssUrl() {
  if (typeof window === "undefined") return "/feed.xml";
  return `${window.location.origin}/feed.xml`;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

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
    <header className="liquid-header sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-[-0.03em]">
          <span className="liquid-chip flex h-9 w-9 items-center justify-center rounded-2xl text-foreground">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="flex items-baseline gap-2">
            <span>Dusk³</span>
            <span className="hidden text-xs font-normal uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              Script & Style
            </span>
          </span>
        </Link>

        <nav className="liquid-nav hidden items-center gap-1 p-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`liquid-nav-item rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "liquid-nav-item-active text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isDev && (
            <Link
              href="/jack/posts"
              className="liquid-nav-item rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              后台
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <>
              <SearchDialog />
              <div className="relative">
                <button
                  onClick={handleCopyRss}
                  className="liquid-chip inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Rss className="h-3 w-3" />
                  RSS
                </button>
                {showCopied && (
                  <span className="absolute right-0 top-10 z-50 w-max max-w-[220px] rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg">
                    已复制 RSS 地址，可粘贴到阅读器订阅
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="liquid-chip h-10 w-10 rounded-full"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="切换主题"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger
              className="md:hidden"
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="liquid-chip h-10 w-10 rounded-full"
                  aria-label="打开菜单"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl px-4 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {isDev && (
                  <Link
                    href="/jack/posts"
                    className="rounded-2xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    后台
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
