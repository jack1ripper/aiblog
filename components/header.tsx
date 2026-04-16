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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 24) {
        setIsVisible(true);
      } else if (delta > 8) {
        setIsVisible(false);
      } else if (delta < -8) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderVisibility);
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
    <header
      className={`sticky top-0 z-50 w-full px-4 pt-4 transition-transform duration-300 ease-out sm:px-6 lg:px-8 ${
        isVisible ? "translate-y-0" : "-translate-y-[calc(100%+1rem)]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-[22px] border border-white/45 bg-white/68 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-[14px] dark:border-white/10 dark:bg-white/8 dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-lg font-semibold tracking-[-0.03em]">
          <span className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/55 bg-white/60 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/12 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate">Dusk³</span>
            <span className="hidden text-xs font-normal uppercase tracking-[0.18em] text-muted-foreground xl:inline">
              Script & Style
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "border-primary/75 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isDev && (
            <Link
              href="/jack/posts"
              className="border-b-2 border-transparent px-1 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
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
                  className="hidden items-center gap-1.5 rounded-[18px] border border-white/55 bg-white/56 px-3 py-2 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:inline-flex"
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
                className="h-10 w-10 rounded-[18px] border border-white/55 bg-white/56 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/10 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
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
                  className="h-10 w-10 rounded-[18px] border border-white/55 bg-white/56 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/10 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  aria-label="打开菜单"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="border-white/10 bg-background/92 backdrop-blur-xl">
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-[18px] px-4 py-3 text-base font-medium transition-colors ${
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
                    className="rounded-[18px] px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
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
