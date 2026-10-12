"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { grammarFolders } from "@/lib/grammar-data";
import { Search, CheckCircle2, XCircle, FolderOpen, ChevronRight } from "lucide-react";

export default function GrammarPage() {
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState<string | null>("particles");
  const [topicId, setTopicId] = useState<string | null>("p-1");
  const [picked, setPicked] = useState<Record<string, number | null>>({});

  const folder = grammarFolders.find(f => f.id === folderId) ?? null;
  const topic = folder?.topics.find(t => t.id === topicId) ?? folder?.topics[0] ?? null;

  const search = q.trim().toLowerCase();
  const filteredFolders = search
    ? grammarFolders.map(f => ({
        ...f,
        topics: f.topics.filter(t => t.title.includes(q) || t.desc.toLowerCase().includes(search) || t.explain.toLowerCase().includes(search)),
      })).filter(f => f.title.toLowerCase().includes(search) || f.topics.length > 0)
    : grammarFolders;

  function openFolder(fid: string) {
    setFolderId(fid);
    const f = grammarFolders.find(x => x.id === fid);
    if (f?.topics[0]) { setTopicId(f.topics[0].id); }
  }
  function openTopic(tid: string) { setTopicId(tid); }

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Grammatika</h1>
        <p className="text-sm text-slate-500">Papka-papka, mavzu-mavzu — har birini ochib, misol va mashq bilan o'rganing</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Qidirish — masalan, 입니다, 에" className="pl-9" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      {/* Papkalar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {filteredFolders.map(f => (
          <button key={f.id} onClick={() => openFolder(f.id)}
            className={`text-left rounded-2xl border p-4 flex flex-col gap-2 transition-all ${folderId===f.id ? "bg-[#eff6ff] border-blue-300 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}>
            <div className="flex items-center gap-2"><FolderOpen className={`h-4 w-4 ${folderId===f.id?"text-[#2563eb]":"text-slate-400"}`} /><span className="font-bold text-sm text-slate-900">{f.title}</span></div>
            <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{f.desc}</div>
            <div className="text-xs text-slate-400">{f.topics.length} mavzu</div>
          </button>
        ))}
      </div>

      {folder && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4">
          {/* Mavzular ro'yxati */}
          <div className="space-y-2">
            {folder.topics.map(t => (
              <button key={t.id} onClick={() => openTopic(t.id)}
                className={`w-full text-left rounded-2xl border p-3 flex items-center justify-between ${topicId===t.id ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                <div className="min-w-0">
                  <div className={`font-bold text-sm ${topicId===t.id?"text-white":"text-slate-900"}`}>{t.title}</div>
                  <div className={`text-xs truncate ${topicId===t.id?"text-white/70":"text-slate-500"}`}>{t.desc} {t.roman?`· ${t.roman}`:""}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge className={`text-[10px] border ${topicId===t.id?"bg-white/15 text-white border-white/20":"bg-white border-slate-200 text-slate-600"}`}>{t.level}</Badge>
                  <ChevronRight className={`h-3.5 w-3.5 ${topicId===t.id?"text-white/60":"text-slate-300"}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Mavzu kontenti */}
          <Card className="p-5 lg:p-6">
            {!topic ? (
              <div className="text-sm text-slate-500">Mavzuni tanlang</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{topic.title} {topic.roman && <span className="font-normal text-slate-400 text-sm">· {topic.roman}</span>}</h2>
                  <p className="text-sm text-slate-500">{topic.desc} · <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">{topic.level}</Badge></p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm leading-relaxed">
                  <div className="font-semibold">Izoh</div>
                  <p className="text-slate-600 mt-1">{topic.explain}</p>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-sm">Misollar — koreyscha → o'zbekcha</div>
                  {topic.examples.map((ex, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-3 text-sm flex flex-col gap-1">
                      <span className="font-medium text-slate-900">{ex.ko}</span>
                      <span className="text-slate-500">— {ex.uz}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="font-semibold text-sm text-[#0f1b3d]">Mashqlar</div>
                  {topic.exercises.map((ex, ei) => {
                    const myPick = picked[`${topic.id}:${ei}`] ?? null;
                    return (
                      <div key={ei} className="rounded-xl bg-[#eff6ff] border border-blue-200 p-4">
                        <p className="text-sm font-medium text-slate-900">{ei+1}. {ex.q}</p>
                        {ex.hint && <p className="text-xs text-slate-500 mt-1">Maslahat: {ex.hint}</p>}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ex.options.map((opt, oi) => {
                            const isCorrect = ex.correct === oi;
                            const chosen = myPick === oi;
                            let cls = "bg-white border-slate-200 text-slate-800 hover:border-blue-300";
                            if (myPick !== null) {
                              if (isCorrect) cls = "bg-emerald-50 border-emerald-300 text-emerald-700";
                              else if (chosen) cls = "bg-red-50 border-red-300 text-red-600";
                              else cls = "bg-white border-slate-200 text-slate-400";
                            }
                            return (
                              <Button key={oi} size="sm" variant="outline" className={cls}
                                onClick={() => { if (myPick !== null) return; setPicked(p => ({ ...p, [`${topic.id}:${ei}`]: oi })); }}>
                                {opt}
                                {myPick !== null && isCorrect && <CheckCircle2 className="h-4 w-4 ml-1" />}
                                {myPick !== null && chosen && !isCorrect && <XCircle className="h-4 w-4 ml-1" />}
                              </Button>
                            );
                          })}
                        </div>
                        {myPick !== null && (
                          <p className={`text-sm mt-2 font-medium ${myPick === ex.correct ? "text-emerald-600" : "text-red-600"}`}>
                            {myPick === ex.correct ? "To'g'ri! ✓" : `Noto'g'ri. To'g'ri: ${ex.options[ex.correct]}`}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
