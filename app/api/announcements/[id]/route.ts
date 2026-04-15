import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["banner", "toast"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });

  if (!announcement) {
    return NextResponse.json({ error: "Not found", errorCode: "ANN_404" }, { status: 404 });
  }

  return NextResponse.json(announcement);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { content, type, link, isActive, startAt, endAt } = body;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found", errorCode: "ANN_404" }, { status: 404 });
  }

  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type", errorCode: "ANN_400" }, { status: 400 });
  }

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      content: content ?? existing.content,
      type: type ?? existing.type,
      link: link !== undefined ? (link || null) : existing.link,
      isActive: isActive !== undefined ? isActive : existing.isActive,
      startAt: startAt !== undefined ? (startAt ? new Date(startAt) : null) : existing.startAt,
      endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : existing.endAt,
    },
  });

  return NextResponse.json(announcement);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found", errorCode: "ANN_404" }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
