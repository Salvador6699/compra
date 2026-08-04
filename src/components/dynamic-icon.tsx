import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

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
  
  if (icon.startsWith("lucide:")) {
    const iconName = icon.replace("lucide:", "");
    // @ts-ignore - dynamic access to lucide icons
    const IconComponent = LucideIcons[iconName];
    if (IconComponent) {
      return <IconComponent className={cn("inline-block align-middle shrink-0 text-foreground", className)} />;
    }
    return <span className="text-base leading-none inline-block align-middle">{fallback}</span>;
  }

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
        className={cn("object-cover rounded-md shrink-0 inline-block align-middle bg-white", className)}
      />
    );
  }
  return <span className="text-base leading-none inline-block align-middle">{icon}</span>;
}
