"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, FileText, DollarSign, Plus } from "lucide-react";
import { toast } from "sonner";

export default function TeacherPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900">Ustoz paneli</h1>
        <Button onClick={()=>toast.success("Yangi dars yaratish — mock")}><Plus className="h-4 w-4 mr-1"/> Yangi dars</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          ["O‘quvchilar","342", Users],
          ["Kurslar","6", BookOpen],
          ["Darslar","128", FileText],
          ["Daromad","18.4M so‘m", DollarSign],
        ] as [string, string, React.ComponentType<{className?: string}>][]).map(([label,val,Icon]) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{label}</span><Icon className="h-4 w-4 text-slate-400"/></div>
            <div className="text-xl font-bold text-slate-900 mt-1">{val}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900">O‘quvchilar progressi</div>
          <div className="mt-3 space-y-3 text-sm">
            {([
              ["Akmal Karimov","TOPIK I",72],
              ["Dilnoza A.","EPS-TOPIK",54],
              ["Jasur B.","Koreys 1",31],
            ] as [string, string, number][]).map(([name,course,prog]) => (
              <div key={name} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#eff6ff] grid place-items-center text-xs font-bold text-[#2563eb]">{name[0]}</div>
                <div className="flex-1 min-w-0"><div className="font-medium text-slate-900 leading-none">{name}</div><div className="text-xs text-slate-500">{course}</div></div>
                <div className="w-24"><Progress value={prog} /></div>
                <span className="text-xs font-medium">{prog}%</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={()=>toast.info("Batafsil ro‘yxat — mock")}>Barcha o‘quvchilar</Button>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-slate-900">Tez amallar</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={()=>toast.success("Dars qo‘shildi (mock)")}>Dars qo‘shish</Button>
            <Button variant="outline" onClick={()=>toast.success("Video yuklandi (mock)")}>Video yuklash</Button>
            <Button variant="outline" onClick={()=>toast.success("Savol qo‘shildi (mock)")}>Savol qo‘shish</Button>
            <Button variant="outline" onClick={()=>toast.success("Topshiriq berildi (mock)")}>Vazifa berish</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
