import crypto from "crypto";

export function getAvatarUrl(email: string, image?: string | null, size = 200): string {
  if (image) {
    return image;
  }
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://secure.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
