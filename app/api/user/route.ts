import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Email not found in session", errorCode: "AUTH_002" }, { status: 401 });
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
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Email not found in session", errorCode: "AUTH_002" }, { status: 401 });
  }

  const body = await req.json();
  const { name, image, bio } = body;

  const updated = await prisma.user.update({
    where: { email: userEmail },
    data: {
      name: name ?? undefined,
      image: image ?? undefined,
      bio: bio ?? undefined,
    },
    select: { id: true, name: true, email: true, image: true, bio: true },
  });

  return NextResponse.json(updated);
}
