import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  User,
  Megaphone,
  Mail,
  BarChart3,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/jack/dashboard", icon: BarChart3, label: "数据看板" },
  { href: "/jack/posts", icon: FileText, label: "文章列表" },
  { href: "/jack/posts/new", icon: PlusCircle, label: "新建文章" },
  { href: "/jack/announcements", icon: Megaphone, label: "站点通知" },
  { href: "/jack/subscribers", icon: Mail, label: "邮件订阅" },
  { href: "/jack/profile", icon: User, label: "个人设置" },
  { href: "/", icon: LayoutDashboard, label: "查看站点" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    redirect("/jack/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b bg-muted/40 md:flex md:w-64 md:flex-col md:border-b-0 md:border-r">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold">管理后台</span>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="查看站点"
            title="查看站点"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <details className="group border-b px-4 py-3 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            功能菜单
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <nav className="mt-2 grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-sm font-medium"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/api/auth/signout" method="POST" className="mt-3">
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-center text-sm font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </form>
        </details>

        <nav className="hidden gap-1 p-4 md:flex md:flex-1 md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/api/auth/signout" method="POST" className="hidden border-t p-4 md:block">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
