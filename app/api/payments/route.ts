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
  let b: { userId?:string; amount?:number; method?:string; status?:string }={};
  try{ b=await req.json(); }catch{}
  const userId=String(b.userId??"").trim(); const amount=Number(b.amount??0); const method=String(b.method??"cash").trim()||"cash";
  let status=String(b.status??"PAID").trim().toUpperCase(); if(!["PENDING","PAID","CANCELLED","FAILED"].includes(status)) status="PAID";
  if(!userId || !amount) return Response.json({ error:"userId va amount kerak"}, { status:400 });
  // teacher can only for own group members
  if(auth.role==="TEACHER"){
    const groups=await prisma.group.findMany({ where:{ teacherId: auth.id }, select:{ id:true }});
    const mems=await prisma.groupMember.findMany({ where:{ groupId:{ in: groups.map(g=>g.id)}}, select:{ userId:true }});
    const ids=new Set(mems.map(m=>m.userId));
    if(!ids.has(userId)) return Response.json({ error:"Bu o'quvchi sizning guruhingizda emas"}, { status:403});
  }
  try{
    const p=await prisma.payment.create({ data:{ userId, amount, method, status: status as never }});
    return Response.json({ ok:true, payment:p });
  }catch(e){ console.error("POST payment",e); return Response.json({ error:"Saqlab bo'lmadi"}, { status:500});}
}
