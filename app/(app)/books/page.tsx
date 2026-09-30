import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { books } from "@/lib/mock-data";
import { BookMarked, FileText } from "lucide-react";

export default function BooksPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Kitoblar</h1>
        <p className="text-sm text-slate-500">TOPIK, grammatika, lug‘at va beginner kitoblari</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {books.map(b => (
          <Card key={b.id} className="overflow-hidden flex flex-col">
            <div className={`h-36 bg-gradient-to-br ${b.color} p-4 text-white flex flex-col`}>
              <BookMarked className="h-6 w-6 opacity-80" />
              <div className="mt-auto font-semibold leading-tight">{b.title}</div>
              <div className="text-xs text-white/80">{b.pages} sahifa</div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 w-fit text-[11px]">{b.level}</Badge>
              <p className="text-xs text-slate-500 leading-relaxed">PDF va audio materiallar bilan. Boshlang‘ichdan professionalgacha.</p>
              <Button size="sm" className="mt-auto w-full"><FileText className="h-4 w-4 mr-1"/> Ochish</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
