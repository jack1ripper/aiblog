"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "订阅成功");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "订阅失败，请稍后重试");
      }
    } catch {
      setStatus("error");
      setMessage("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
        订阅更新
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        输入邮箱，第一时间获取新文章通知。
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || !email.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              提交中
            </>
          ) : (
            "订阅"
          )}
        </Button>
      </form>
      {status !== "idle" && (
        <Alert
          variant={status === "error" ? "destructive" : "default"}
          className="mt-3"
        >
          <AlertDescription className="flex items-center gap-1.5">
            {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
