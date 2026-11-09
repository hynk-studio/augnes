import assert from 'node:assert/strict';

export async function checkControlBoundaryContrast(evaluate, selector) {
  const rendered=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(e);let p=e.parentElement,backgrounds=[];while(p){backgrounds.push(getComputedStyle(p).backgroundColor);p=p.parentElement;}return {visible:e.getClientRects().length>0,border:s.borderTopColor,style:s.borderTopStyle,width:parseFloat(s.borderTopWidth),inside:s.backgroundColor,backgrounds};})()`);
  const rgb=color=>{const values=color.match(/[\d.]+/g).map(Number);return [...values.slice(0,3),values[3]??1];};
  const over=(foreground,background)=>foreground.slice(0,3).map((v,i)=>v*foreground[3]+background[i]*(1-foreground[3]));
  const outside=rendered.backgrounds.toReversed().reduce((background,color)=>over(rgb(color),background),[255,255,255]);
  const inside=over(rgb(rendered.inside),outside),border=over(rgb(rendered.border),inside);
  const luminance=channels=>channels.map(n=>n/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
  const result={selector,...rendered,composited:{border,inside,outside},insideContrast:contrast(border,inside),outsideContrast:contrast(border,outside)};
  console.log(JSON.stringify({rendered_input_boundary:result}));
  assert(rendered.visible&&rendered.style==='solid'&&rendered.width>=1);
  assert(Math.min(result.insideContrast,result.outsideContrast)>=3,'Rendered input boundary must remain distinguishable against both adjacent backgrounds');
  return result;
}
