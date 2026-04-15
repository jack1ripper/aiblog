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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span>Dusk³</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Script & Style</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[15px] h-0.5 rounded-full bg-foreground" />
                )}
              </Link>
            );
          })}
          {isDev && (
            <Link
              href="/jack/posts"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
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
                  className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Rss className="h-3 w-3" />
                  RSS
                </button>
                {showCopied && (
                  <span className="absolute right-0 top-9 z-50 w-max max-w-[220px] rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg">
                    已复制 RSS 地址，可粘贴到阅读器订阅
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
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
              render={<Button variant="ghost" size="icon" className="h-9 w-9" aria-label="打开菜单" />}
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
                      className={`rounded-md px-3 py-2 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-muted text-foreground"
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
                    className="rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
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
