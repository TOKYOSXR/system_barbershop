import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  className?: string;
}

/** Circular avatar showing an image or the user's initials as fallback. */
export function Avatar({ name, src, className }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-medium text-primary",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}
