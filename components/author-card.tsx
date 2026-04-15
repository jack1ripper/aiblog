import { Avatar } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/gravatar";

interface AuthorCardProps {
  name: string;
  email: string;
  image?: string | null;
  bio?: string | null;
}

export function AuthorCard({ name, email, image, bio }: AuthorCardProps) {
  const avatarUrl = getAvatarUrl(email, image, 128);

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      <Avatar
        src={avatarUrl}
        alt={name}
        fallback={name}
        className="h-16 w-16"
      />
      <div className="flex-1">
        <div className="text-base font-semibold">{name || "匿名作者"}</div>
        {bio ? (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{bio}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">暂无简介</p>
        )}
      </div>
    </div>
  );
}
