import { pinyin } from "pinyin-pro";

export function generateSlug(title: string): string {
  let result = "";
  for (const char of title) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      result += pinyin(char, { toneType: "none", type: "string" }) + " ";
    } else if (/[a-zA-Z0-9]/.test(char)) {
      result += char;
    } else {
      result += " ";
    }
  }
  return result
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}
