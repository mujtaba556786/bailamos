import type { Campaign } from './marketing-campaign';

export async function createCampaignPoster(campaign: Campaign): Promise<Blob> {
  if(campaign.mediaKind!=='image'||!campaign.mediaUrl)throw new Error('Bitte zuerst ein Foto auswählen.');
  await document.fonts.ready;
  const image=new Image();image.src=campaign.mediaUrl;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=campaign.format==='story'?1920:campaign.format==='square'?1080:1350;
  const context=canvas.getContext('2d');if(!context)throw new Error('Poster können in diesem Browser nicht erstellt werden.');
  const ctx:CanvasRenderingContext2D=context;
  const w=canvas.width,h=canvas.height,photoHeight=Math.round(h*.62),scale=Math.max(w/image.width,photoHeight/image.height);
  ctx.fillStyle='#10261e';ctx.fillRect(0,0,w,h);
  ctx.drawImage(image,(w-image.width*scale)/2,(photoHeight-image.height*scale)/2,image.width*scale,image.height*scale);
  ctx.fillStyle='#d6a45f';ctx.fillRect(64,photoHeight+40,70,4);
  ctx.font='bold 25px sans-serif';ctx.fillText('BAILAMOS · BERLIN',64,photoHeight+86);
  let y=photoHeight+145;
  function lines(text:string,font:string,lineHeight:number,maxLines:number){
    ctx.font=font;
    // Text stays exact; fail explicitly if it cannot fit rather than silently truncating a promotion.
    const words=text.split(/\s+/);const rendered:string[]=[];let current='';
    for(const word of words){if(ctx.measureText(current?current+' '+word:word).width>952&&current){rendered.push(current);current=word}else current=current?current+' '+word:word;}if(current)rendered.push(current);
    if(rendered.length>maxLines)throw new Error('Der Postertext ist zu lang. Bitte Überschrift oder Details kürzen.');
    for(const value of rendered){ctx.fillText(value,64,y,952);y+=lineHeight;}
  }
  ctx.fillStyle='#fff4df';lines(campaign.headline||campaign.title,'bold 52px Georgia',60,2);
  y+=10;lines(campaign.detail,'28px sans-serif',38,2);
  ctx.fillStyle='#d6a45f';ctx.font='bold 27px sans-serif';ctx.fillText(campaign.cta,64,h-52,952);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Poster konnte nicht erstellt werden.')),'image/jpeg',.92));
}
