import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export interface SendNewsletterOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendNewsletterEmail(options: SendNewsletterOptions) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY is not set, skipping email send.");
    return { id: null, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { id: null, error };
    }

    return { id: data?.id || null, error: null };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { id: null, error: err };
  }
}

export async function notifySubscribersOnPublish(post: {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/posts/${post.slug}`;

  const subscribers = await prisma.subscriber.findMany({
    where: { isActive: true },
    select: { email: true },
  });

  if (subscribers.length === 0) {
    console.log("[Email] No active subscribers, skipping newsletter.");
    await prisma.post.update({
      where: { id: post.id },
      data: { newsletterSentAt: new Date() },
    });
    return { sent: 0, total: 0 };
  }

  const html = buildNewsletterHtml({
    siteUrl,
    postUrl,
    title: post.title,
    excerpt: post.excerpt,
  });

  let sentCount = 0;

  await Promise.all(
    subscribers.map(async (sub) => {
      const result = await sendNewsletterEmail({
        to: sub.email,
        subject: `Dusk³ 新文章：${post.title}`,
        html,
      });
      if (!result.error) {
        sentCount++;
      }
    })
  );

  await prisma.post.update({
    where: { id: post.id },
    data: { newsletterSentAt: new Date() },
  });

  console.log(`[Email] Newsletter sent to ${sentCount}/${subscribers.length} subscribers.`);

  return { sent: sentCount, total: subscribers.length };
}

export function buildNewsletterHtml(params: {
  siteUrl: string;
  postUrl: string;
  title: string;
  excerpt?: string | null;
}) {
  const { siteUrl, postUrl, title, excerpt } = params;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>新文章发布通知</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    h1 { font-size: 20px; font-weight: 600; color: #111111; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 24px; }
    .btn { display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .footer { text-align: center; font-size: 12px; color: #888888; margin-top: 24px; }
    .footer a { color: #888888; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>新文章发布：${escapeHtml(title)}</h1>
      ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ""}
      <a class="btn" href="${escapeHtml(postUrl)}">阅读全文</a>
    </div>
    <div class="footer">
      <p>来自 <a href="${escapeHtml(siteUrl)}">Dusk³</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
