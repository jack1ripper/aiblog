"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Announcement {
  id: string;
  content: string;
  type: "banner" | "toast";
  link?: string | null;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "加载失败");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.announcements || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "网络错误");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条通知吗？")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "删除失败");
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">站点通知</h1>
        <Link href="/jack/announcements/new">
          <Button>新建通知</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-md border p-5 text-center text-sm text-muted-foreground">暂无通知</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="space-y-3 rounded-md border p-4">
              <div className="space-y-2">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-words text-sm font-medium leading-6 hover:underline"
                  >
                    {item.content}
                  </a>
                ) : (
                  <p className="break-words text-sm font-medium leading-6">{item.content}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "启用" : "停用"}
                  </Badge>
                  <span>{item.type === "banner" ? "横幅" : "浮层"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.startAt || item.endAt
                    ? `${item.startAt ? new Date(item.startAt).toLocaleString("zh-CN") : "不限"} ~ ${
                        item.endAt ? new Date(item.endAt).toLocaleString("zh-CN") : "不限"
                      }`
                    : "永久"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/jack/announcements/${item.id}/edit`}>
                  <Button size="sm" variant="outline">
                    编辑
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  删除
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>内容</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-xs truncate font-medium">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {item.content}
                    </a>
                  ) : (
                    item.content
                  )}
                </TableCell>
                <TableCell>
                  {item.type === "banner" ? "横幅" : "浮层"}
                </TableCell>
                <TableCell>
                  {item.isActive ? (
                    <Badge variant="default">启用</Badge>
                  ) : (
                    <Badge variant="secondary">停用</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.startAt || item.endAt ? (
                    <span>
                      {item.startAt
                        ? new Date(item.startAt).toLocaleString("zh-CN")
                        : "不限"}
                      {" ~ "}
                      {item.endAt
                        ? new Date(item.endAt).toLocaleString("zh-CN")
                        : "不限"}
                    </span>
                  ) : (
                    "永久"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/jack/announcements/${item.id}/edit`}>
                      <Button size="sm" variant="outline">
                        编辑
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  暂无通知
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
