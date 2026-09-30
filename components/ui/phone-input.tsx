"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { formatUZ, isValidUZ } from "@/lib/phone";
import { Phone } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void; // formatted +998 ...
  error?: string;
  label?: string;
  requiredMark?: boolean;
};

// UZ +998 maskali input. Boshqa davlatlar inputMode orqali kiritilsa ham formatUZ ishlaydi.
export function PhoneInput({ value, onValueChange, className, placeholder = "+998 90 123 45 67", label, error, requiredMark, ...rest }: Props) {
  const [touched, setTouched] = React.useState(false);
  const showError = (touched || !!error) && value ? !isValidUZ(value) : false;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatUZ(e.target.value);
    onValueChange(formatted);
  }

  return (
    <div className="w-full">
      {label && (
        <label className="text-xs font-medium text-slate-700">
          {label} {requiredMark && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={cn("relative mt-1", label ? "" : "")}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-600 border border-slate-200">
          UZ
        </span>
        <Phone className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          inputMode="tel"
          autoComplete="tel"
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-xl border bg-white pl-[76px] pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            showError ? "border-red-300 focus:ring-red-400" : "border-slate-200",
            className
          )}
          {...rest}
        />
      </div>
      {showError && <p className="mt-1 text-xs text-red-600">Telefon formati: +998 90 123 45 67</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Oddiy telefon linki (tel: + whatsapp + copy)
export function PhoneLink({ phone, display, className }: { phone: string; display?: string; className?: string }) {
  const href = `tel:${phone.replace(/\s/g, "")}`;
  return (
    <a href={href} className={cn("inline-flex items-center gap-1.5 font-medium text-[#2563eb] hover:underline underline-offset-4", className)}>
      <Phone className="h-3.5 w-3.5" />
      {display ?? phone}
    </a>
  );
}
