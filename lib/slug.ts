import { prisma } from "./prisma";
import { generateSlug } from "./slugify";

export { generateSlug };

export async function ensureUniqueSlug(
  baseSlug: string,
  existingId?: string
): Promise<string> {
  let slug = baseSlug || "untitled";
  let counter = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        slug,
        ...(existingId ? { NOT: { id: existingId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
