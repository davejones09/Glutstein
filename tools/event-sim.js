/* Event-Simulation: Siegquote je Abschnitt (1–4) für typische Spielerdecks auf verschiedenen Spielerleveln.
   Aufruf: node tools/event-sim.js index.html */
const fs=require('fs');
const html=fs.readFileSync(process.argv[2]||'index.html','utf8'), src=html.split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const A=new Function(src+';return {BASE,SETS,newBattle,simulate,mult,MAXLVL,MAXSTAR,rng,hash};')();
const EV=Object.keys(A.SETS).filter(x=>A.SETS[x].ev);
/* Spielerdeck: 8 normale Karten, Seltenheit und Level passend zum Spielerlevel. */
function pdeck(pl,seed){ const r=A.rng(seed), lvl=Math.max(1,Math.min(25,Math.round(pl*.55))), star=Math.ceil(lvl/5), rr=[[0,0,0,0,0,0,1,1],[0,0,0,1,1,1,2,2],[0,1,1,1,2,2,2,3],[1,1,2,2,2,2,3,3]][pl<8?0:pl<18?1:pl<30?2:3];
  const pool=A.BASE.filter(c=>!A.SETS[c.set].ev&&!A.SETS[c.set].foe); return rr.map(x=>{ const p=pool.filter(c=>c.r===x); return {id:p[Math.floor(r()*p.length)].id,lvl,star}; }); }
const HPF=JSON.parse(process.env.HPF||"[1,1.4,1.8,2.3]"), OFF=JSON.parse(process.env.OFF||"[-3,-1,0,1]"), GR=JSON.parse(process.env.GR||"[2,3,3,4]");
function stage(anc,a,i){ const boss=i===15, elite=[4,9,13].includes(i), lvl=Math.max(1,Math.min(25,anc+OFF[a]+Math.floor(i*GR[a]/15)+(elite?2:0)+(boss?2:0))), star=Math.min(5,Math.ceil(lvl/5));
  return {a,i,boss,elite,lvl,star,size:Math.min(8,[3,4,5,6][a]+Math.floor(i/6)+(boss?1:0)),hp:Math.round((800+i*30+a*150+(boss?400:0))*HPF[a]*A.mult(star,lvl)/10)*10}; }
const ROWS=[[5,1,0,0],[3,2,1,0],[1,3,2,0],[1,2,2,0],[0,2,3,1]], TOPR=[1,2,2,3,3];
function erow(anc,a){ return Math.max(0,Math.min(4,a+(anc<=4?-1:anc>=14?1:0))); }
function edeck(set,st,seed,anc){ const r=A.rng(seed), s=A.BASE.filter(c=>c.set===set), of=x=>s.filter(c=>c.r===x), pk=a=>a[Math.floor(r()*a.length)].id, ids=[], R=erow(anc,st.a), w=ROWS[R], tot=w.reduce((x,y)=>x+y,0);
  if(st.boss) ids.push(of(TOPR[R])[0].id); if(st.elite) ids.push(pk(of(TOPR[R])));
  while(ids.length<st.size){ let v=r()*tot, x=0; while(v>=w[x]&&x<3){ v-=w[x]; x++; } ids.push(pk(of(x))); } return ids.map(id=>({id,lvl:st.lvl,star:st.star})); }
for(const pl of [1,5,12,20,30,40]){ const anc=Math.max(1,Math.round(pl*.55)), out=[];
  for(let a=0;a<4;a++){ let w=0,n=0; for(const set of EV) for(const i of [0,4,8,13,15]) for(let k=0;k<6;k++){ const st=stage(anc,a,i), B=A.simulate(A.newBattle(pdeck(pl,k*7+i),edeck(set,st,k+i*31,anc),st.hp)); n++; if(B.over==='p') w++; } out.push(Math.round(w/n*100)+'%'); }
  console.log(`Spielerlevel ${String(pl).padStart(2)} · Abschnitt I–IV: ${out.join('  ')}`); }
