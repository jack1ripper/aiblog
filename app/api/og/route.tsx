import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "我的博客";
  const author = searchParams.get("author") || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          padding: 80,
          position: "relative",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 12,
            backgroundColor: "#3B82F6",
          }}
        />

        {/* Site name */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#A3A3A3",
            marginBottom: 24,
            letterSpacing: "0.05em",
          }}
        >
          我的博客
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#FAFAFA",
            lineHeight: 1.2,
            maxWidth: 1000,
            marginBottom: 40,
          }}
        >
          {title}
        </div>

        {/* Author */}
        {author && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#A3A3A3",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: "#3B82F6" }}>·</span>
            <span>{author}</span>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
