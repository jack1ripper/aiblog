import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-extrabold tracking-tight text-foreground">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">页面不存在或已被移除</p>
      <Link href="/">
        <Button className="mt-8">返回首页</Button>
      </Link>
    </div>
  );
}
