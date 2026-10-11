import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

async function getAuth(req: Request){
  const t = readAuthToken(req); const d = verify(t); if(!d) return null;
  let email=String(d.email??""), id=d.id?String(d.id):"", role=String(d.role??"");
  try{
    if(email){ const u=await prisma.user.findUnique({ where:{ email:normalizeEmail(email)}, select:{ id:true, role:true, email:true}}); if(u){ id=u.id; role=String(u.role); email=u.email; } }
    else if(id){ const u=await prisma.user.findUnique({ where:{ id}, select:{ id:true, role:true, email:true}}); if(u){ id=u.id; role=String(u.role); email=u.email; } }
  }catch{}
  return { id,email,role };
}

export async function GET(req:Request){
  const auth = await getAuth(req);
  if(!auth) return Response.json({ error:"Auth kerak"}, { status:401 });
  const url=new URL(req.url); const userId=url.searchParams.get("userId")?.trim()||""; const groupId=url.searchParams.get("groupId")?.trim()||"";
  try{
    // teacher: payments of own groups members
    if(auth.role==="TEACHER"){
      if(groupId){
        const mems=await prisma.groupMember.findMany({ where:{ groupId }, select:{ userId:true } });
        const ids=mems.map(m=>m.userId);
        // verify own group
        const g=await prisma.group.findUnique({ where:{ id:groupId}, select:{ teacherId:true }});
        if(String(g?.teacherId??"")!==auth.id) return Response.json({ error:"Bu guruh sizniki emas"}, { status:403});
        const payments=await prisma.payment.findMany({ where:{ userId:{ in: ids }}, include:{ user:{ select:{ id:true, name:true, email:true }}}, orderBy:{ createdAt:"desc"}, take:200 });
        return Response.json({ payments });
      }
      // all groups of teacher
      const groups=await prisma.group.findMany({ where:{ teacherId: auth.id }, select:{ id:true }});
      const groupIds=groups.map(g=>g.id);
      const mems=await prisma.groupMember.findMany({ where:{ groupId:{ in: groupIds }}, select:{ userId:true }});
      const ids=[...new Set(mems.map(m=>m.userId))];
      if(ids.length===0) return Response.json({ payments:[]});
      const payments=await prisma.payment.findMany({ where:{ userId:{ in: ids }}, include:{ user:{ select:{ id:true, name:true, email:true }}}, orderBy:{ createdAt:"desc"}, take:200 });
      return Response.json({ payments });
    }
    if(auth.role==="ADMIN"){
      const where: Record<string,unknown>={};
      if(userId) (where as Record<string,string>).userId=userId;
      else if(groupId){
        const mems=await prisma.groupMember.findMany({ where:{ groupId }, select:{ userId:true }});
        where.userId={ in: mems.map(m=>m.userId)};
        if(mems.length===0) return Response.json({ payments:[]});
      }
      const payments=await prisma.payment.findMany({ where: where as never, include:{ user:{ select:{ id:true, name:true, email:true }}}, orderBy:{ createdAt:"desc"}, take:300 });
      return Response.json({ payments });
    }
    // STUDENT — own
    const payments=await prisma.payment.findMany({ where:{ userId: auth.id }, orderBy:{ createdAt:"desc"}, take:100 });
    return Response.json({ payments });
  }catch(e){ console.error("GET payments",e); return Response.json({ payments:[]});}
}

export async function POST(req:Request){
  const auth=await getAuth(req);
  if(!auth || (auth.role!=="ADMIN" && auth.role!=="TEACHER")) return Response.json({ error:"Faqat ustoz/admin"}, { status:403});
  let b: { userId?:string; amount?:number; method?:string; status?:string; month?:string; note?:string }={};
  try{ b=await req.json(); }catch{}
  const userId=String(b.userId??"").trim(); const amount=Number(b.amount??0); const method=String(b.method??"cash").trim()||"cash";
  const month=String(b.month??"").trim(); const note=String(b.note??"").trim();
  let status=String(b.status??"PENDING").trim().toUpperCase(); if(!["PENDING","PAID","CANCELLED","FAILED"].includes(status)) status="PENDING";
  if(!userId || !amount) return Response.json({ error:"userId va amount kerak"}, { status:400 });
  // teacher can only for own group members
  if(auth.role==="TEACHER"){
    const groups=await prisma.group.findMany({ where:{ teacherId: auth.id }, select:{ id:true }});
    const mems=await prisma.groupMember.findMany({ where:{ groupId:{ in: groups.map(g=>g.id)}}, select:{ userId:true }});
    const ids=new Set(mems.map(m=>m.userId));
    if(!ids.has(userId)) return Response.json({ error:"Bu o'quvchi sizning guruhingizda emas"}, { status:403});
  }
  try{
    const p=await prisma.payment.create({ data:{ userId, amount, method, month: month||undefined, note: note||undefined, status: status as never }});
    // O'quvchiga bildirishnoma: eslatma (PENDING) yoki to'lov qabul qilindi (PAID)
    try {
      const su = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const who = su?.name ? `${su.name}, ` : "";
      let title:string, body:string;
      if(status==="PENDING"){
        title="To'lov eslatmasi";
        body=`${who}${amount.toLocaleString("uz-UZ")} so'm${month?` — ${month} oy uchun`:""} to'lash talab qilinadi. Iltimos, to'lovni amalga oshiring.${note?` Izoh: ${note}`:""}`;
      } else {
        title="To'lov qabul qilindi";
        body=`${who}${amount.toLocaleString("uz-UZ")} so'm${month?` — ${month} oy uchun`:""} muvaffaqiyatli to'landi.${note?` Izoh: ${note}`:""}`;
      }
      await prisma.notification.create({ data:{ userId, title, body } }).catch(()=>{});
    } catch {}
    return Response.json({ ok:true, payment:p });
  }catch(e){ console.error("POST payment",e); return Response.json({ error:"Saqlab bo'lmadi"}, { status:500});}
}

// PATCH /api/payments — to'lov holatini almashtirish (masalan: PENDING → PAID) + o'quvchiga bildirishnoma
export async function PATCH(req:Request){
  const auth=await getAuth(req);
  if(!auth || (auth.role!=="ADMIN" && auth.role!=="TEACHER")) return Response.json({ error:"Faqat ustoz/admin"}, { status:403});
  let b: { id?:string; status?:string }={};
  try{ b=await req.json(); }catch{}
  const id=String(b.id??"").trim(); const status=String(b.status??"").trim().toUpperCase();
  if(!id || !["PENDING","PAID","CANCELLED","FAILED"].includes(status)) return Response.json({ error:"id va status kerak"}, { status:400 });
  try{
    const p=await prisma.payment.findUnique({ where:{ id }, select:{ id:true, userId:true, amount:true, month:true, note:true, status:true }});
    if(!p) return Response.json({ error:"To'lov topilmadi"}, { status:404});
    // teacher faqat o'z guruhidagi o'quvchining to'lovini o'zgartira oladi
    if(auth.role==="TEACHER"){
      const groups=await prisma.group.findMany({ where:{ teacherId: auth.id }, select:{ id:true }});
      const mems=await prisma.groupMember.findMany({ where:{ groupId:{ in: groups.map(g=>g.id)}}, select:{ userId:true }});
      const ids=new Set(mems.map(m=>m.userId));
      if(!ids.has(p.userId)) return Response.json({ error:"Bu o'quvchi sizning guruhingizda emas"}, { status:403});
    }
    const upd=await prisma.payment.update({ where:{ id }, data:{ status: status as never }});
    // Status "PAID" bo'lsa — o'quvchiga "muvaffaqiyatli to'landi" bildirishnomasi
    if(status==="PAID"){
      try {
        const su=await prisma.user.findUnique({ where:{ id:p.userId }, select:{ name:true }});
        await prisma.notification.create({
          data:{
            userId:p.userId,
            title:"To'lov muvaffaqiyatli qabul qilindi",
            body:`${su?.name?`${su.name}, `:""}${p.amount.toLocaleString("uz-UZ")} so'm${p.month?` — ${p.month} oy uchun`:""} to'lov tasdiqlandi. Rahmat!`,
          },
        }).catch(()=>{});
      } catch {}
    }
    return Response.json({ ok:true, payment:upd });
  }catch(e){ console.error("PATCH payment",e); return Response.json({ error:"O'zgartirib bo'lmadi"}, { status:500});}
}
