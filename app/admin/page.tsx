"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, GraduationCap, Layers, Wallet, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const growth = [
  { name: "Yan", students: 820 },
  { name: "Fev", students: 910 },
  { name: "Mar", students: 1050 },
  { name: "Apr", students: 1180 },
  { name: "May", students: 1248 },
];
const revenue = [
  { name: "Yan", value: 8.2 },
  { name: "Fev", value: 9.1 },
  { name: "Mar", value: 10.4 },
  { name: "Apr", value: 11.8 },
  { name: "May", value: 12.5 },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex gap-1.5 text-xs">
          {["Bugun","7 kun","30 kun","12 oy"].map(f => <button key={f} className={`px-3 py-1.5 rounded-full border ${f==="30 kun" ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-600 border-slate-200"}`}>{f}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-slate-500"><span className="text-xs">O‘quvchilar</span><Users className="h-4 w-4"/></div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">1 248</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3"/> +12% bu oy</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-slate-500"><span className="text-xs">Ustozlar</span><GraduationCap className="h-4 w-4"/></div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">24</div>
          <div className="text-xs text-slate-500 mt-1">4 ta yangi</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-slate-500"><span className="text-xs">Guruhlar</span><Layers className="h-4 w-4"/></div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">36</div>
          <div className="text-xs text-slate-500 mt-1">12 ta faol</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-slate-500"><span className="text-xs">Tugatgan darslar</span><Wallet className="h-4 w-4"/></div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">87%</div>
          <div className="text-xs text-emerald-600 mt-1">barcha kurslar bepul</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          ["Qabullar","Arizalar","/admission"],
          ["O‘quvchilar","Ro‘yxat","/admin"],
          ["Ustozlar","Boshqarish","/teacher"],
          ["Guruhlar","Jadval","/admin"],
          ["Vazifalar","Topshiriq","/admin"],
          ["Kontent","Kurslar / Testlar","/admin/content"],
          ["Bloklangan ilovalar","Ruxsatlar","/admin/blocked-apps"],
          ["Universitetlar","Ro‘yxat","/universities"],
          ["AI yordamchi","Chat","/ai"],
          ["Broadcast","Xabar","/admin"],
          ["Statistika","Grafik","/admin"],
          ["Sozlamalar","Tizim","/admin"],
        ].map(([title, sub, href]) => (
          <Link key={title} href={href}><Card className="p-4 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between"><div><div className="font-medium text-sm text-slate-900">{title}</div><div className="text-xs text-slate-500">{sub}</div></div><span className="text-[#2563eb] text-xs font-medium">Ochish →</span></Card></Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900">O‘quvchilar o‘sishi</div>
          <div className="h-[240px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Faollik (o‘quvchilar)</div>
          <div className="h-[240px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f1b3d" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Kurs yakunlash</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Koreys 1</span><span className="font-medium">95%</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-full w-[95%] rounded-full bg-emerald-500" /></div>
            <div className="flex justify-between"><span>TOPIK I</span><span className="font-medium">87%</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-full w-[87%] rounded-full bg-[#2563eb]" /></div>
            <div className="flex justify-between"><span>EPS-TOPIK</span><span className="font-medium">78%</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-full w-[78%] rounded-full bg-violet-500" /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-slate-900">So‘nggi faoliyat</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0"/> Yangi o‘quvchi ro‘yxatdan o‘tdi — <span className="text-slate-500">5 daqiqa oldin</span></li>
            <li className="flex gap-2"><span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0"/> Yangi ustoz qo‘shildi — <span className="text-slate-500">1 soat oldin</span></li>
            <li className="flex gap-2"><span className="h-2 w-2 rounded-full bg-violet-500 mt-2 shrink-0"/> Guruh yaratildi — <span className="text-slate-500">kecha</span></li>
            <li className="flex gap-2"><span className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0"/> Kontent yangilandi — <span className="text-slate-500">kecha</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
