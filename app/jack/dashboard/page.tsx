"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  totalPosts: number;
  totalViews: number;
  trend: { date: string; count: number }[];
  maxTrend: number;
  topPosts: { id: string; title: string; slug: string; views: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard")
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "加载数据失败");
        }
        return res.json();
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">数据看板</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const trend = data?.trend || [];
  const maxTrend = data?.maxTrend || 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">数据看板</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总文章数</CardDescription>
            <CardTitle className="text-3xl">{data?.totalPosts ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <FileText className="mr-1 h-3.5 w-3.5" />
              包含已发布与草稿
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总阅读量</CardDescription>
            <CardTitle className="text-3xl">{data?.totalViews ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground">
              <Eye className="mr-1 h-3.5 w-3.5" />
              文章页累计访问
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            近 7 天访问趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trend.every((t) => t.count === 0) ? (
            <div className="flex h-48 flex-col items-center justify-center text-sm text-muted-foreground">
              <span>近 7 天暂无访问数据</span>
              <span className="text-xs">文章页被访问后会自动记录</span>
            </div>
          ) : (
            <div className="flex h-48 items-end gap-2 sm:gap-4">
              {trend.map((item) => {
                const heightPercent = maxTrend ? (item.count / maxTrend) * 100 : 0;
                const barHeight = `${Math.max(heightPercent, 4)}%`;
                return (
                  <div key={item.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className="w-full max-w-[40px] rounded-md bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: barHeight, minHeight: "8px" }}
                      aria-label={`${item.date} ${item.count} 次访问`}
                      title={`${item.date}: ${item.count} 次访问`}
                    />
                    <div className="text-[10px] text-muted-foreground sm:text-xs">
                      {format(new Date(item.date), "MM/dd")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最受欢迎文章 TOP 5</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {data?.topPosts?.length ? (
              data.topPosts.map((post, idx) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/posts/${post.slug}`}
                      target="_blank"
                      className="line-clamp-1 font-medium hover:underline"
                    >
                      {post.title}
                    </Link>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
