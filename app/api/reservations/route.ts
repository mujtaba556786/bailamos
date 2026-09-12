import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import tables from "../../../data/tables.json";

type Reservation={id:string;status:string;date:string;time:string;guestCount:number;durationMinutes:number;tableId:string;customer:{name:string;phone:string;email:string};occasion?:string;dietary?:string;notes?:string;createdAt:string;updatedAt:string};
const active=new Set(["pending","confirmed","arrived","seated"]);
const mins=(v:string)=>{const [h,m]=v.split(":").map(Number);return h*60+m};
const overlap=(a:string,ad:number,b:string,bd:number)=>mins(a)<mins(b)+bd&&mins(b)<mins(a)+ad;
let queue=Promise.resolve();

export async function POST(request:NextRequest){
  const b=await request.json(),date=String(b.date||""),time=String(b.time||""),guestCount=Number(b.guestCount),durationMinutes=120;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||!Number.isInteger(guestCount)||guestCount<1||guestCount>10)return NextResponse.json({error:"Ungültige Reservierungsdaten."},{status:400});
  if(!b.customer?.name||!b.customer?.phone||!b.customer?.email)return NextResponse.json({error:"Bitte füllen Sie Name, Telefon und E-Mail aus."},{status:400});
  if(!env.DB)return NextResponse.json({error:"Reservierungsspeicher ist noch nicht konfiguriert."},{status:503});
  let result:any;
  queue=queue.then(async()=>{
    const query=await env.DB!.prepare("SELECT id, status, date, time, guest_count, duration_minutes, table_id, customer_name, customer_phone, customer_email, occasion, dietary, notes, created_at, updated_at FROM reservations WHERE date = ? AND status IN ('pending', 'confirmed', 'arrived', 'seated')").bind(date).all<Record<string,unknown>>();
    const reservations:Reservation[]=(query.results||[]).map((row)=>({id:String(row.id),status:String(row.status),date:String(row.date),time:String(row.time),guestCount:Number(row.guest_count),durationMinutes:Number(row.duration_minutes),tableId:String(row.table_id),customer:{name:String(row.customer_name),phone:String(row.customer_phone),email:String(row.customer_email)},occasion:String(row.occasion||""),dietary:String(row.dietary||""),notes:String(row.notes||""),createdAt:String(row.created_at),updatedAt:String(row.updated_at)}));
    const available=(id:string)=>!reservations.some(r=>r.tableId===id&&active.has(r.status)&&overlap(time,durationMinutes,r.time,r.durationMinutes||120));
    const candidates=tables.filter(t=>t.enabled&&t.capacity>=guestCount&&available(t.id));
    const tableId=b.tableId==="restaurant-choice"||!b.tableId?candidates[0]?.id:String(b.tableId);
    if(!tableId||!candidates.some(t=>t.id===tableId)){result={ok:false,error:"Dieser Tisch wurde gerade vergeben.",alternatives:candidates.map(t=>t.id)};return}
    const now=new Date().toISOString(),reservation:Reservation={id:`R-${date.replaceAll("-","").slice(2)}-${crypto.randomUUID().slice(0,4).toUpperCase()}`,status:"pending",date,time,guestCount,durationMinutes,tableId,customer:{name:String(b.customer.name),phone:String(b.customer.phone),email:String(b.customer.email)},occasion:String(b.occasion||""),dietary:String(b.dietary||""),notes:String(b.notes||""),createdAt:now,updatedAt:now};
    await env.DB!.prepare("INSERT INTO reservations (id, status, date, time, guest_count, duration_minutes, table_id, customer_name, customer_phone, customer_email, occasion, dietary, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(reservation.id,reservation.status,reservation.date,reservation.time,reservation.guestCount,reservation.durationMinutes,reservation.tableId,reservation.customer.name,reservation.customer.phone,reservation.customer.email,reservation.occasion||"",reservation.dietary||"",reservation.notes||"",reservation.createdAt,reservation.updatedAt).run();result={ok:true,reservation};
  });
  await queue;return result.ok?NextResponse.json(result,{status:201}):NextResponse.json(result,{status:409});
}
