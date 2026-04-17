"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function MobileBackHandle() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/88 px-3 py-2 text-xs font-medium text-foreground shadow-[0_8px_24px_rgba(15,23,42,0.16)] backdrop-blur md:hidden"
      aria-label="返回上一个页面"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      返回
    </button>
  );
}
