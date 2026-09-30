import Link from "next/link";
import { LayoutDashboard, Users, BookOpen, FileText, Video } from "lucide-react";

const nav = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher", label: "O‘quvchilar", icon: Users },
  { href: "/teacher", label: "Kurslar", icon: BookOpen },
  { href: "/teacher", label: "Darslar", icon: Video },
  { href: "/teacher", label: "Testlar", icon: FileText },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <div className="h-[56px] bg-[#0f1b3d] text-white flex items-center px-6 justify-between sticky top-0 z-30">
        <Link href="/teacher" className="font-bold">DREAM KOREA — Teacher</Link>
        <Link href="/dashboard" className="text-sm text-white/80 hover:text-white">Student view →</Link>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-[220px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] bg-white border-r border-slate-200 p-3">
          <nav className="space-y-1">
            {nav.map(i => <Link key={i.label} href={i.href} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><i.icon className="h-4 w-4"/>{i.label}</Link>)}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
