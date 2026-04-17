"use client";

import { useEffect, useState } from "react";
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

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

export default function AdminSubscribersPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscribers")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "加载失败");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.subscribers || []);
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

  async function toggleStatus(id: string, current: boolean) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "更新失败");
      }
      const result = await res.json();
      setItems((prev) =>
        prev.map((s) => (s.id === id ? result.subscriber : s))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "更新失败");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="rounded-md border">
          <div className="space-y-3 p-4">
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">邮件订阅</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 md:hidden">
        {items.length === 0 ? (
          <div className="rounded-md border p-5 text-center text-sm text-muted-foreground">暂无订阅者</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="space-y-3 rounded-md border p-4">
              <div className="space-y-2">
                <p className="break-all text-sm font-medium">{item.email}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "已订阅" : "已取消"}
                  </Badge>
                  <span>{new Date(item.subscribedAt).toLocaleString("zh-CN")}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={item.isActive ? "outline" : "default"}
                disabled={updatingId === item.id}
                onClick={() => toggleStatus(item.id, item.isActive)}
              >
                {updatingId === item.id
                  ? "更新中..."
                  : item.isActive
                    ? "取消订阅"
                    : "恢复订阅"}
              </Button>
            </article>
          ))
        )}
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮箱</TableHead>
              <TableHead>订阅时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.email}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.subscribedAt).toLocaleString("zh-CN")}
                </TableCell>
                <TableCell>
                  {item.isActive ? (
                    <Badge variant="default">已订阅</Badge>
                  ) : (
                    <Badge variant="secondary">已取消</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={item.isActive ? "outline" : "default"}
                    disabled={updatingId === item.id}
                    onClick={() => toggleStatus(item.id, item.isActive)}
                  >
                    {updatingId === item.id
                      ? "更新中..."
                      : item.isActive
                        ? "取消订阅"
                        : "恢复订阅"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  暂无订阅者
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
