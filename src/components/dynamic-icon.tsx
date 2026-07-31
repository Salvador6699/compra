import { cn } from "@/lib/utils";

export function DynamicIcon({
  icon,
  fallback = "📦",
  className = "h-4 w-4 rounded object-cover shrink-0 inline-block",
}: {
  icon?: string;
  fallback?: string;
  className?: string;
}) {
  if (!icon) return <span className="text-base leading-none inline-block align-middle">{fallback}</span>;
  const isImg =
    icon.startsWith("data:image/") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("blob:") ||
    icon.length > 30;
  if (isImg) {
    return (
      <img
        src={icon}
        alt=""
        className={cn("object-cover rounded-md shrink-0 inline-block align-middle", className)}
      />
    );
  }
  return <span className="text-base leading-none inline-block align-middle">{icon}</span>;
}
