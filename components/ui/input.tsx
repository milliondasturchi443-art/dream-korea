import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", className)} {...props} />
));
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("flex min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", className)} {...props} />
));
Textarea.displayName = "Textarea";
