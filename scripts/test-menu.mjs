import {Miniflare} from "miniflare";
import {readFile,readdir} from "node:fs/promises";
import assert from "node:assert/strict";
import defaults from "../data/menu.json" with {type:"json"};
import {getMenuContent,saveMenuContent,validateMenu} from "../lib/menu-content.ts";
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:["DB"]});let passed=0;async function test(name,fn){await fn();passed++;console.log(`PASS ${name}`)}
try{const db=await mf.getD1Database("DB");for(const file of (await readdir(new URL("../drizzle/",import.meta.url))).filter(name=>name.endsWith(".sql")).sort()){const sql=await readFile(new URL(`../drizzle/${file}`,import.meta.url),"utf8");for(const statement of sql.split("--> statement-breakpoint").filter(value=>value.trim()))await db.prepare(statement).run()}
 await test("existing menu is the safe initial version",async()=>{const result=await getMenuContent(db);assert.equal(result.source,"default");assert.equal(result.content.dishes.length,defaults.dishes.length)});
 await test("price and availability save durably",async()=>{const content=structuredClone(defaults);content.dishes[0].price=15.5;content.dishes[0].available=false;const saved=await saveMenuContent(db,content,0);assert.equal(saved.version,1);const loaded=await getMenuContent(db);assert.equal(loaded.content.dishes[0].price,15.5);assert.equal(loaded.content.dishes[0].available,false)});
 await test("stale menu editor is rejected",()=>assert.rejects(saveMenuContent(db,defaults,0),{code:"STALE_MENU"}));
 await test("invalid prices, unsafe images and missing categories are rejected",async()=>{const price=structuredClone(defaults);price.dishes[0].price=12.345;assert.throws(()=>validateMenu(price));const unsafe=structuredClone(defaults);unsafe.dishes[0].image="javascript:alert(1)";assert.throws(()=>validateMenu(unsafe));const category=structuredClone(defaults);category.dishes[0].categoryId="missing";assert.throws(()=>validateMenu(category))});
 console.log(`${passed} menu-management regression checks passed; isolated database disposed.`)}finally{await mf.dispose()}
