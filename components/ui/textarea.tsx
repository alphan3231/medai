import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[112px] w-full rounded-[1.5rem] border border-[rgba(24,32,24,0.12)] bg-white/85 px-4 py-3 text-sm text-[#182018] outline-none transition focus:border-[#245946] focus:ring-4 focus:ring-[#245946]/10",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
