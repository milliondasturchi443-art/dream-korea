import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-base sm:text-sm placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,27,61,.07),0_1px_0_rgba(255,255,255,.9)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", className)} {...props} />
));
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("flex min-h-[96px] w-full rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md px-3 py-2 text-base sm:text-sm placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,27,61,.07),0_1px_0_rgba(255,255,255,.9)] focus:outline-none focus:ring-2 focus:ring-blue-500", className)} {...props} />
));
Textarea.displayName = "Textarea";
