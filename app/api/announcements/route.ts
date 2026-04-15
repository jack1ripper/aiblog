import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["banner", "toast"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAdmin = !!token && token.role === "admin";

  const activeOnly = !isAdmin || searchParams.get("activeOnly") === "true";

  const where = activeOnly
    ? {
        isActive: true,
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: new Date() }, endAt: null },
          { startAt: null, endAt: { gte: new Date() } },
          { startAt: { lte: new Date() }, endAt: { gte: new Date() } },
        ],
      }
    : {};

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const body = await req.json();
  const { content, type, link, isActive, startAt, endAt } = body;

  if (!content || !type) {
    return NextResponse.json({ error: "Missing required fields", errorCode: "ANN_400" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type", errorCode: "ANN_400" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      content,
      type,
      link: link || null,
      isActive: isActive ?? true,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
