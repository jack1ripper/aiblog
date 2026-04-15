import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import path from "path";
import { unlink } from "fs/promises";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const userEmail = typeof token.email === "string" ? token.email : null;
  if (!userEmail) {
    return NextResponse.json({ error: "Email not found in token", errorCode: "AUTH_002" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, email: true, image: true, bio: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found", errorCode: "USER_404" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const userEmail = typeof token.email === "string" ? token.email : null;
  if (!userEmail) {
    return NextResponse.json({ error: "Email not found in token", errorCode: "AUTH_002" }, { status: 401 });
  }

  const body = await req.json();
  const { name, image, bio } = body;

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { image: true },
  });

  const updated = await prisma.user.update({
    where: { email: userEmail },
    data: {
      name: name ?? undefined,
      image: image ?? undefined,
      bio: bio ?? undefined,
    },
    select: { id: true, name: true, email: true, image: true, bio: true },
  });

  if (image && existingUser?.image && existingUser.image !== image && existingUser.image.startsWith("/uploads/")) {
    try {
      const oldPath = path.join(process.cwd(), "public", existingUser.image);
      await unlink(oldPath);
    } catch {
      // ignore cleanup errors
    }
  }

  return NextResponse.json(updated);
}
