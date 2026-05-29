import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export function AnimatedLogo({ size = "md", className, animate = true }: AnimatedLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-primary text-primary-foreground",
        sizeClasses[size],
        animate && "animate-logo-pulse",
        className
      )}
    >
      <svg 
        className={cn(iconSizeClasses[size], animate && "animate-logo-bounce")} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
    </div>
  );
}
