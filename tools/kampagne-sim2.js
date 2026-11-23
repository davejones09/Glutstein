// Kampagne mit langsamerem Fortschritt: Spieler hat nur Bronze/Silber (keine Gold-/Diamantkarten aus Truhen) und niedrigere Level.
const fs=require('fs'); const hero=process.argv[3]==='h';
const src=fs.readFileSync(process.argv[2],'utf8').split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const A=new Function(src+';return {BASE,CARD,STAGES,STARTER,STRONG,AREAS,stageDeck,stageHp,newBattle,simulate,stars,rarRoom,stageCond};')();
const PLV=[[1,1,1,2,2,2,3,3],[3,3,4,4,4,5,5,6],[6,6,7,7,8,8,9,9],[9,9,10,10,11,11,12,12],[12,12,13,13,14,14,15,16],[16,16,17,17,18,18,19,20],[20,20,21,21,22,22,23,23]];
function owned(k){ const o=A.STARTER.slice(); [[97,'butler'],[99,'tueftler'],[101,'funkerin'],[103,'laura'],[105,'fahrer']].forEach(([n,id])=>{ if(k>=n) o.push(id); }); /* Folge 2: Karten aus der Geschichte */ A.STAGES.slice(0,k).forEach(s=>{ if(s.unlock) o.push(s.unlock); if(s.boss) A.BASE.filter(c=>c.set===A.AREAS[s.area].set&&c.r<=1).forEach(c=>o.push(c.id)); }); A.BASE.filter(c=>c.r===0&&!c.set.match(/^(horde|gefolge|brut|hof|orden|schlaefer|teehof)$/)).forEach(c=>o.push(c.id)); return [...new Set(o)]; }
function pdeck(st){ const o=owned(st.id-1).map(id=>A.CARD[id]);
  const sc=c=>(A.STRONG[c.cat]===st.cat?100:0)-(A.STRONG[st.cat]===c.cat?100:0)+c.r*10+(c.a+c.h)/100;
  const lv=PLV[st.area][Math.floor(st.i*8/16)], cs=A.stageCond(st,hero), mx=Math.min(8,...cs.filter(c=>c.t==='max').map(c=>c.n)), nor=Math.min(9,...cs.filter(c=>c.t==='nor').map(c=>c.r)), pick=[];
  /* Seltenheitsregel und Bedingungen wie im Spiel: Pflichtkarten zuerst, dann die besten erlaubten. */
  cs.filter(c=>c.t==='card').forEach(c=>pick.push(c.id));
  cs.filter(c=>c.t==='cat'||c.t==='set').forEach(c=>{ const m=x=>c.t==='cat'?A.CARD[x].cat===c.c:A.CARD[x].set===c.s; const pool=o.filter(x=>m(x.id)&&!pick.includes(x.id)&&A.rarRoom(pick,x.r)).sort((a,b)=>sc(b)-sc(a));
    while(pick.filter(m).length<c.n){ const x=pool.shift()||A.BASE.find(y=>m(y.id)&&y.r===0&&!pick.includes(y.id)); if(!x) break; pick.push(x.id); } });
  o.sort((a,b)=>sc(b)-sc(a)).forEach(c=>{ if(pick.length<mx&&!pick.includes(c.id)&&c.r<nor&&A.rarRoom(pick,c.r)) pick.push(c.id); });
  return pick.slice(0,mx).map(id=>({id,lvl:lv,star:Math.min(5,Math.ceil(lv/5))})); }
const out=[];
for(const st of A.STAGES){ const o=A.stageDeck(st,hero), hp=A.stageHp(st,hero); let w=0; const N=200; for(let i=0;i<N;i++){ const B=A.simulate(A.newBattle(pdeck(st),o,hp)); if(B.over==='p') w++; }
  out.push((st.boss?'*':'')+st.id+':'+Math.round(w/N*100)); }
for(let a=0;a<A.AREAS.length;a++) console.log(out.slice(a*16,a*16+16).join(' '));
