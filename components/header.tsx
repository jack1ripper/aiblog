"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Moon, Sun, Menu, User, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/gravatar";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "归档" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // hydration guard: avoid mismatch between SSR and CSR
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isAdmin = session?.user?.role === "admin";
  const adminAvatarUrl = isAdmin && session.user?.email
    ? getAvatarUrl(session.user.email, session.user.image || null, 80)
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          我的博客
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/posts"
            className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            后台
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="切换主题"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {mounted && isAdmin && adminAvatarUrl && (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative inline-flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar
                  src={adminAvatarUrl}
                  alt={session.user?.name || "Admin"}
                  fallback={session.user?.name || "A"}
                  className="h-8 w-8"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 text-sm font-medium text-foreground">
                  {session.user?.name || "管理员"}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/admin/posts")}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  后台管理
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/admin/profile")}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  个人设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet>
            <SheetTrigger
              className="md:hidden"
              render={<Button variant="ghost" size="icon" aria-label="打开菜单" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/admin/posts"
                  className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  后台
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/profile"
                      className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      个人设置
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-left text-base font-medium text-destructive transition-colors hover:text-destructive/80"
                    >
                      退出登录
                    </button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
