// Kampagne mit langsamerem Fortschritt: Spieler hat nur Bronze/Silber (keine Gold-/Diamantkarten aus Truhen) und niedrigere Level.
const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8').split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const A=new Function(src+';return {BASE,CARD,STAGES,STARTER,STRONG,stageDeck,stageHp,newBattle,simulate,stars};')();
const PLV=[[1,1,1,2,2,2,3,3],[3,3,4,4,4,5,5,6],[6,6,7,7,8,8,9,9],[9,9,10,10,11,11,12,12],[12,12,13,13,14,14,15,16]];
function owned(k){ const o=A.STARTER.slice(); A.STAGES.slice(0,k).forEach(s=>{ if(s.unlock) o.push(s.unlock); if(s.boss) A.BASE.filter(c=>c.set===s.set&&c.r<=1).forEach(c=>o.push(c.id)); }); A.BASE.filter(c=>c.r===0).forEach(c=>o.push(c.id)); return [...new Set(o)]; }
function pdeck(st){ const o=owned(st.id-1).map(id=>A.CARD[id]);
  const sc=c=>(A.STRONG[c.cat]===st.cat?100:0)-(A.STRONG[st.cat]===c.cat?100:0)+c.r*10+(c.a+c.h)/100;
  const lv=PLV[st.area][Math.floor(st.i*8/16)]; return o.sort((a,b)=>sc(b)-sc(a)).slice(0,8).map(c=>({id:c.id,lvl:lv,star:Math.min(5,Math.ceil(lv/5))})); }
const hero=process.argv[3]==='h', out=[];
for(const st of A.STAGES){ const o=A.stageDeck(st,hero), hp=A.stageHp(st,hero); let w=0; const N=200; for(let i=0;i<N;i++){ const B=A.simulate(A.newBattle(pdeck(st),o,hp)); if(B.over==='p') w++; }
  out.push((st.boss?'*':'')+st.id+':'+Math.round(w/N*100)); }
for(let a=0;a<5;a++) console.log(out.slice(a*16,a*16+16).join(' '));
