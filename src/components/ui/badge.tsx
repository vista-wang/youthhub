import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "outline" | "info";
}

const variantClasses = {
  default: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  secondary: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-brand-green/10 text-brand-green border-brand-green/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  outline: "bg-transparent border-slate-300 text-slate-600",
  info: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
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
