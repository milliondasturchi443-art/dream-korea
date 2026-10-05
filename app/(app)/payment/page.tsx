import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export default function PaymentPage() {
  return (
    <div className="mx-auto max-w-[640px] p-4 lg:p-6 space-y-5">
      <Card className="p-6 text-center">
        <h1 className="text-[22px] font-bold text-slate-900">To‘lov shart emas</h1>
        <p className="text-sm text-slate-500 mt-1">Barcha kurslar bepul. To‘lov sahifasi o‘chirildi.</p>
        <Link href="/courses"><Button className="mt-4">Kurslarga o‘tish</Button></Link>
      </Card>
    </div>
  );
}
