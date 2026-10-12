"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { booksData } from "@/lib/books-data";
import { BookMarked, FileText, X, Download, Eye } from "lucide-react";
import jsPDF from "jspdf";

function downloadPdf(bookId: string) {
  const b = booksData.find(x => x.id === bookId);
  if (!b) return;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 14;
  const maxW = W - M*2;

  // Cover
  doc.setFillColor(15,27,61);
  doc.rect(0,0,W,54,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(22); doc.setFont("helvetica","bold");
  doc.text(b.title, M, 20, { maxWidth: maxW });
  doc.setFontSize(10); doc.setFont("helvetica","normal");
  doc.text(`${b.level}  ·  ${b.pages} sahifa  ·  DREAM KOREA`, M, 32);
  doc.setFontSize(8); doc.setTextColor(147,197,253);
  doc.text("Koreys tili — o'quv materiali (sample). To'liq kitob admin tomonidan PDF sifatida yuklanadi.", M, 40, { maxWidth: maxW });
  doc.text("© 2026 DREAM KOREA · Namangan", M, 46);

  // Body
  doc.setTextColor(15,23,42);
  let y = 64;
  function addPageIfNeeded(need: number) {
    if (y + need > H - 14) { doc.addPage(); y = 16; }
  }
  for (const ch of b.chapters) {
    addPageIfNeeded(18);
    doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.setTextColor(15,27,61);
    const titleLines = doc.splitTextToSize(ch.title, maxW);
    doc.text(titleLines, M, y); y += titleLines.length*6 + 4;
    doc.setDrawColor(226,232,240); doc.line(M, y, W-M, y); y += 6;
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(51,65,85);
    for (const line of ch.body) {
      const lines = doc.splitTextToSize(line, maxW);
      addPageIfNeeded(lines.length*5 + 4);
      doc.text(lines, M, y); y += lines.length*5 + 4;
    }
    y += 6;
  }
  // Footer on each page
  const n = doc.getNumberOfPages();
  for (let i=1;i<=n;i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(148,163,184);
    doc.text(`DREAM KOREA · ${b.title} · ${i}/${n}`, M, H-8);
  }
  doc.save(`${b.title.replace(/\s+/g,"_")}.pdf`);
}

export default function BooksPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const book = booksData.find(b => b.id === openId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function openPreview(bid: string) {
    const b = booksData.find(x=>x.id===bid);
    if (!b) return;
    if (b.pdfUrl) { setPreviewUrl(b.pdfUrl); setOpenId(bid); return; }
    // generate blob url from jsPDF for preview
    const doc = new jsPDF({ unit:"mm", format:"a4" });
    const W=210,H=297,M=14,maxW=W-M*2;
    doc.setFillColor(15,27,61); doc.rect(0,0,W,54,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont("helvetica","bold");
    doc.text(b.title, M, 20, { maxWidth:maxW });
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text(`${b.level} · ${b.pages} sahifa · DREAM KOREA`, M, 32);
    doc.setFontSize(8); doc.setTextColor(147,197,253); doc.text("Sample PDF — to'liq kitob admin tomonidan yuklanadi.", M, 40, { maxWidth:maxW });
    doc.setTextColor(15,23,42); let y=64;
    function need(n:number){ if(y+n>H-14){ doc.addPage(); y=16; } }
    for (const ch of b.chapters) {
      need(18);
      doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(15,27,61);
      const tl=doc.splitTextToSize(ch.title, maxW); doc.text(tl, M, y); y+=tl.length*6+4;
      doc.setDrawColor(226,232,240); doc.line(M,y,W-M,y); y+=6;
      doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(51,65,85);
      for (const line of ch.body) { const ll=doc.splitTextToSize(line, maxW); need(ll.length*5+4); doc.text(ll, M, y); y+=ll.length*5+4; }
      y+=6;
    }
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url); setOpenId(bid);
  }

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Kitoblar</h1>
        <p className="text-sm text-slate-500">Haqiqiy materiallar — oching va PDF yuklab oling. Keyin admin haqiqiy PDF larni qo‘shadi.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {booksData.map(b => (
          <Card key={b.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className={`h-36 bg-gradient-to-br ${b.color} p-4 text-white flex flex-col`}>
              <BookMarked className="h-6 w-6 opacity-80" />
              <div className="mt-auto font-semibold leading-tight line-clamp-2">{b.title}</div>
              <div className="text-xs text-white/80">{b.pages} sahifa</div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 w-fit text-[11px]">{b.level}</Badge>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{b.description}</p>
              <div className="mt-auto grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => openPreview(b.id)}><Eye className="h-4 w-4 mr-1"/> Ko'rish</Button>
                <Button size="sm" onClick={() => downloadPdf(b.id)}><Download className="h-4 w-4 mr-1"/> PDF</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {book && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 p-0 sm:p-4" onClick={() => { setOpenId(null); if(previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
          <div className="bg-white w-full h-full sm:rounded-2xl overflow-hidden flex flex-col sm:max-w-4xl sm:mx-auto sm:max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className={`bg-gradient-to-br ${book.color} text-white p-4 flex items-start justify-between shrink-0`}>
              <div>
                <div className="font-bold text-lg leading-tight">{book.title}</div>
                <div className="text-xs text-white/80 mt-1">{book.level} · {book.pages} sahifa</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="bg-white text-slate-900 hover:bg-slate-50" onClick={()=>downloadPdf(book.id)}><Download className="h-4 w-4 mr-1"/> Yuklab olish</Button>
                <button onClick={() => { setOpenId(null); if(previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="p-2 rounded-full hover:bg-white/15" aria-label="Yopish"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
              <div className="flex-1 min-h-[260px] bg-slate-100">
                {previewUrl ? (
                  <iframe src={previewUrl} title={book.title} className="w-full h-full border-0" />
                ) : (
                  <div className="grid place-items-center h-full text-sm text-slate-500 p-8"><FileText className="h-8 w-8 mb-2 opacity-40"/> PDF tayyorlanmoqda…</div>
                )}
              </div>
              <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-slate-200 overflow-y-auto p-4 space-y-4 bg-white">
                {book.chapters.map((ch, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900 text-sm">{ch.title}</div>
                    <div className="mt-2 space-y-2">
                      {ch.body.map((line, j) => (<p key={j} className="text-sm text-slate-600 leading-relaxed">{line}</p>))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
