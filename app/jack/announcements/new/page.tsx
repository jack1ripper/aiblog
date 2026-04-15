import { AnnouncementForm } from "@/components/announcement-form";

export default function NewAnnouncementPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新建通知</h1>
      <AnnouncementForm />
    </div>
  );
}
