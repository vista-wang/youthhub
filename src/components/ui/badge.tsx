import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "outline";
}

const variantClasses = {
  default: "bg-dopamine-pink/10 text-dopamine-pink border-dopamine-pink/20",
  secondary: "bg-gray-100 text-gray-600 border-gray-200",
  success: "bg-dopamine-green/10 text-dopamine-green border-dopamine-green/20",
  warning: "bg-dopamine-orange/10 text-dopamine-orange border-dopamine-orange/20",
  outline: "bg-transparent border-gray-300 text-gray-600",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
