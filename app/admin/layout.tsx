import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { FileText, PlusCircle, LayoutDashboard, LogOut, User, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b bg-muted/40 md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          管理后台
        </div>
        <nav className="flex gap-2 p-4 md:flex-col">
          <Link
            href="/admin/posts"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            文章列表
          </Link>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <PlusCircle className="h-4 w-4" />
            新建文章
          </Link>
          <Link
            href="/admin/announcements"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Megaphone className="h-4 w-4" />
            站点通知
          </Link>
          <Link
            href="/admin/profile"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <User className="h-4 w-4" />
            个人设置
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LayoutDashboard className="h-4 w-4" />
            查看站点
          </Link>
          <form action="/api/auth/signout" method="POST" className="mt-auto">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
