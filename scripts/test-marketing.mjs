import { Miniflare } from "miniflare";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import defaults from "../data/marketing.json" with {type:"json"};
import { getMarketingContent, saveMarketingContent, validateMarketingContent } from "../lib/marketing-content.ts";

const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:["DB"]});
let passed=0;async function test(name,fn){await fn();passed++;console.log(`PASS ${name}`)}
try{
 const db=await mf.getD1Database("DB");
 for(const file of (await readdir(new URL("../drizzle/",import.meta.url))).filter(name=>name.endsWith(".sql")).sort()){const sql=await readFile(new URL(`../drizzle/${file}`,import.meta.url),"utf8");for(const statement of sql.split("--> statement-breakpoint").filter(value=>value.trim()))await db.prepare(statement).run()}
 await test("default content loads before first owner save",async()=>{const result=await getMarketingContent(db);assert.equal(result.source,"default");assert.equal(result.content.events.length,defaults.events.length)});
 let saved;
 await test("owner content saves durably",async()=>{const content=structuredClone(defaults);content.social.instagram.url="https://instagram.com/bailamos";content.events[0].title.de="Mezcal Abend";saved=await saveMarketingContent(db,content,0);assert.equal(saved.version,1);const loaded=await getMarketingContent(db);assert.equal(loaded.content.events[0].title.de,"Mezcal Abend")});
 await test("stale editor cannot overwrite newer content",()=>assert.rejects(saveMarketingContent(db,defaults,0),{code:"STALE_CONTENT"}));
 await test("unsafe links and duplicate event ids are rejected",async()=>{const unsafe=structuredClone(defaults);unsafe.social.instagram.url="javascript:alert(1)";assert.throws(()=>validateMarketingContent(unsafe),{code:"INVALID_URL"});const duplicate=structuredClone(defaults);duplicate.events[1].id=duplicate.events[0].id;assert.throws(()=>validateMarketingContent(duplicate),{code:"DUPLICATE_EVENT"})});
 console.log(`${passed} content-management regression checks passed; isolated database disposed.`);
}finally{await mf.dispose()}
