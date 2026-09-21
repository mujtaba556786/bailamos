import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {validateCampaign,saveCampaign,listCampaigns} from '../lib/marketing-campaign.ts';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
const draft={id:'test-campaign',title:'Taco evening',headline:'Tacos',detail:'Friday',cta:'Reserve',captionDe:'Hallo',captionEn:'Hello',language:'de',mediaUrl:'/table-window.webp',mediaKind:'image',format:'portrait',destinations:{instagram:'now',tiktok:'now',facebook:'later'},approved:true};
try{
 const db=await mf.getD1Database('DB');
 for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(name=>name.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();
 assert.deepEqual(await listCampaigns(db),[]);
 const saved=await saveCampaign(db,draft,0);assert.equal(saved.version,1);
 assert.deepEqual((await listCampaigns(db))[0].content,draft);console.log('PASS migrations and persistent bilingual drafts with per-channel choices');
 await assert.rejects(saveCampaign(db,draft,0),{code:'STALE_CAMPAIGN'});
 await saveCampaign(db,{...draft,destinations:{...draft.destinations,facebook:'now'}},1);
 await assert.rejects(saveCampaign(db,draft,1),{code:'STALE_CAMPAIGN'});console.log('PASS concurrent edits protected');
 for(const change of [{mediaUrl:'javascript:alert(1)'},{mediaUrl:'//evil.example/a.jpg'},{captionDe:'x'.repeat(2201)},{destinations:{...draft.destinations,tiktok:'invalid'}},{approved:true,mediaUrl:''},{approved:true,captionDe:''}])assert.throws(()=>validateCampaign({...draft,...change}));
 assert.equal(validateCampaign({...draft,approved:false,mediaUrl:'',captionDe:''}).approved,false);console.log('PASS input validation, incomplete drafts and approval prerequisites');
 assert.equal(await db.prepare('SELECT COUNT(*) AS count FROM marketing_content').first('count'),0);console.log('PASS campaign saves do not publish website content');
}finally{await mf.dispose()}
