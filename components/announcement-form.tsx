"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnnouncementFormProps {
  initialData?: {
    id: string;
    content: string;
    type: "banner" | "toast";
    link?: string | null;
    isActive: boolean;
    startAt?: Date | null;
    endAt?: Date | null;
  };
}

function toDatetimeLocalValue(date?: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementForm({ initialData }: AnnouncementFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [content, setContent] = useState(initialData?.content || "");
  const [type, setType] = useState(initialData?.type || "banner");
  const [link, setLink] = useState(initialData?.link || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(initialData?.startAt));
  const [endAt, setEndAt] = useState(toDatetimeLocalValue(initialData?.endAt));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      content,
      type,
      link: link.trim() || null,
      isActive,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(endAt).toISOString() : null,
    };

    try {
      const url = isEdit ? `/api/announcements/${initialData.id}` : "/api/announcements";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "保存失败");
      }
      router.push("/jack/announcements");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="content">内容</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入通知内容"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">类型</Label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as "banner" | "toast")}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          required
        >
          <option value="banner">顶部横幅（Banner）</option>
          <option value="toast">浮层提示（Toast）</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">链接（可选）</Label>
        <Input
          id="link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="isActive">启用</Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startAt">开始时间（可选）</Label>
          <Input
            id="startAt"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAt">结束时间（可选）</Label>
          <Input
            id="endAt"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : isEdit ? "保存修改" : "创建通知"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/jack/announcements")}>
          取消
        </Button>
      </div>
    </form>
  );
}
