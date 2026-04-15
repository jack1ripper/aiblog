import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { error: "Invalid email", errorCode: "SUB_400" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.subscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (!existing.isActive) {
      await prisma.subscriber.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return NextResponse.json({ success: true, message: "订阅成功" });
  }

  await prisma.subscriber.create({
    data: { email: normalizedEmail },
  });

  return NextResponse.json({ success: true, message: "订阅成功" }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  return NextResponse.json({ subscribers });
}
