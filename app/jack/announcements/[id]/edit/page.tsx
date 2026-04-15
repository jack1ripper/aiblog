import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnnouncementForm } from "@/components/announcement-form";

interface EditAnnouncementPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });

  if (!announcement) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑通知</h1>
      <AnnouncementForm
        initialData={{
          ...announcement,
          type: announcement.type as "banner" | "toast",
        }}
      />
    </div>
  );
}
