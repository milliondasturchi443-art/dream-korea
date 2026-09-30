export function Logo({ dark = false, size = 36 }: { dark?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <path d="M24 4 L42 14 L42 34 L24 44 L6 34 L6 14 Z" fill="none" stroke={dark ? "#0f1b3d" : "#0f1b3d"} strokeWidth="2.2" />
          <path d="M24 10 L36 17 L36 31 L24 38 L12 31 L12 17 Z" fill="#0f1b3d" />
          <text x="24" y="28.5" textAnchor="middle" fontSize="16" fontWeight="800" fill="white" fontFamily="sans-serif">D</text>
          <circle cx="34" cy="12" r="3.2" fill="#ef4444" />
        </svg>
      </div>
      <div className="leading-none">
        <div className={`font-extrabold tracking-tight text-[15px] ${dark ? "text-[#0f1b3d]" : "text-[#0f1b3d]"} `}>DREAM KOREA</div>
        <div className="text-[9px] tracking-[0.18em] text-slate-500 font-medium">KOREAN LANGUAGE CENTER</div>
      </div>
    </div>
  );
}
