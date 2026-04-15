import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_PREFIX = "image/";
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized", errorCode: "AUTH_001" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided", errorCode: "UPLOAD_001" }, { status: 400 });
  }

  if (!file.type.startsWith(ALLOWED_MIME_PREFIX)) {
    return NextResponse.json(
      { error: "Only image files are allowed", errorCode: "UPLOAD_002" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 5MB limit", errorCode: "UPLOAD_003" },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, GIF, WEBP are allowed", errorCode: "UPLOAD_004" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = file.name
    .replace(/\\/g, "-")
    .replace(/\//g, "-")
    .replace(/[^\w.\-]/g, "-");
  const filename = `${Date.now()}-${safeName}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
