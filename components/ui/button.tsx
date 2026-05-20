import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[#245946] px-4 py-2.5 text-white shadow-[0_12px_30px_rgba(36,89,70,0.25)] hover:-translate-y-0.5 hover:bg-[#1d4a3a]",
        secondary:
          "border-[rgba(24,32,24,0.1)] bg-white/70 px-4 py-2.5 text-[#182018] hover:bg-white",
        ghost: "border-transparent bg-transparent px-3 py-2 text-[#5c665d] hover:bg-white/60 hover:text-[#182018]",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
