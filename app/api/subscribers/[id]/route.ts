import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive } = body;

  if (typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "Invalid isActive value", errorCode: "SUB_400" },
      { status: 400 }
    );
  }

  const updated = await prisma.subscriber.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ subscriber: updated });
}
