import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-blue text-white shadow-sm hover:bg-brand-blue-dark hover:shadow-md",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
        outline:
          "border-2 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900",
        link:
          "text-brand-blue underline-offset-4 hover:underline",
        primary:
          "bg-gradient-to-r from-brand-blue to-brand-teal text-white shadow-md hover:shadow-lg",
        success:
          "bg-brand-green text-white hover:bg-brand-green-dark shadow-sm hover:shadow-md",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
