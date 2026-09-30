import Image from "next/image";

export function Logo({ size = 36, withText = true }: { dark?: boolean; size?: number; withText?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="DREAM KOREA"
        width={size}
        height={size}
        className="shrink-0 rounded-xl object-contain bg-white"
        priority
      />
      {withText && (
        <span className="leading-none">
          <span className="block font-extrabold tracking-tight text-[15px] text-[#0f1b3d]">DREAM KOREA</span>
          <span className="block text-[9px] tracking-[0.18em] text-slate-500 font-medium">KOREAN LANGUAGE CENTER</span>
        </span>
      )}
    </span>
  );
}

// Квадратная иконка для шапок/аватаров
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="DK"
      width={size}
      height={size}
      className={`rounded-xl object-contain ${className}`}
    />
  );
}
