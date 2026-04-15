import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || undefined;
    const referrer = req.headers.get("referer") || undefined;

    // 异步写入，不阻塞渲染（这里已经是 API 边界，直接写入即可）
    await prisma.pageView.create({
      data: {
        path: path.slice(0, 512),
        referrer: referrer ? referrer.slice(0, 512) : null,
        ua: ua ? ua.slice(0, 512) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
