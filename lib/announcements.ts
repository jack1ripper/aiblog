import { prisma } from "@/lib/prisma";

export async function getActiveBanners() {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      type: "banner",
      isActive: true,
      OR: [
        { startAt: null, endAt: null },
        { startAt: { lte: now }, endAt: null },
        { startAt: null, endAt: { gte: now } },
        { startAt: { lte: now }, endAt: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}
