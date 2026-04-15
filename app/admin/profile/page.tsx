"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarUrl } from "@/lib/gravatar";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
}

export default function AdminProfilePage() {
  const { update } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user")
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          console.error("Profile load failed:", res.status, text);
          throw new Error(`加载失败 (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Failed to load user profile:", err);
        setLoading(false);
      });
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "上传失败");
      }

      const updateRes = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadData.url }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.error || "保存失败");
      }

      setUser((prev) => (prev ? { ...prev, image: uploadData.url } : prev));
      await update({ image: uploadData.url });
      setMessage("头像更新成功");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "头像上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, bio: user.bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "保存失败");
      }
      setUser(data);
      await update({ name: user.name, image: user.image });
      setMessage("保存成功");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        加载用户信息失败，请尝试重新登录后刷新页面。如果问题持续存在，请检查浏览器控制台中的错误日志。
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user.email, user.image, 160);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-bold">个人设置</h1>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl}
            alt={user.name || ""}
            fallback={user.name || "?"}
            className="h-24 w-24"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "上传中..." : "更换头像"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              支持 JPG、PNG、GIF，最大 5MB。未上传时使用 Gravatar。
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">昵称</Label>
            <Input
              id="name"
              value={user.name || ""}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              placeholder="你的昵称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" value={user.email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">简介</Label>
            <Textarea
              id="bio"
              value={user.bio || ""}
              onChange={(e) => setUser({ ...user, bio: e.target.value })}
              placeholder="一句话介绍自己"
              rows={4}
            />
          </div>

          {message && (
            <div
              className={`text-sm ${
                message.includes("失败") || message.includes("错误")
                  ? "text-destructive"
                  : "text-green-600"
              }`}
            >
              {message}
            </div>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存资料"}
          </Button>
        </form>
      </div>
    </div>
  );
}
