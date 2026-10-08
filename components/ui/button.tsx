import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_10px_24px_-8px_rgba(37,99,235,.65)] hover:from-[#60a5fa] hover:to-[#2563eb]",
        outline:
          "glass text-slate-800 hover:brightness-105 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_12px_28px_-12px_rgba(15,27,61,.35)]",
        ghost: "hover:bg-white/70 hover:backdrop-blur-md text-slate-700",
        navy:
          "bg-gradient-to-b from-[#1b2f63] to-[#0f1b3d] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_10px_24px_-8px_rgba(15,27,61,.7)] hover:from-[#223b7a] hover:to-[#162a5e]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-8 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
