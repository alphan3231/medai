import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-[1.25rem] border border-[rgba(24,32,24,0.12)] bg-white/80 px-4 text-sm text-[#182018] outline-none transition focus:border-[#245946] focus:ring-4 focus:ring-[#245946]/10",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
