const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8').split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const A=new Function(src+';return {BASE,CARD,STAGES,STARTER,AREAS,SETS,STRONG,stageDeck,stageHp,newBattle,simulate,stars,P_HP};')();
const run=(d,o,hp)=>{const B=A.simulate(A.newBattle(d,o,hp));return {w:B.over==='p',s:A.stars(B)};};
function owned(k){ const o=A.STARTER.slice(); A.STAGES.slice(0,k).forEach(s=>{ if(s.unlock) o.push(s.unlock); if(s.boss) A.BASE.filter(c=>c.set===s.set&&c.r>=2).forEach(c=>o.push(c.id)); }); return [...new Set(o)]; }
// Spieler wählt sinnvoll: Karten mit Vorteil gegen das Gebiet zuerst, dann nach Seltenheit; Level-Annahme je Gebiet
const PLV=[[1,1,2,2,3,3,4,4],[5,5,6,6,7,7,8,9],[10,10,11,11,12,12,13,14],[15,15,16,16,17,17,18,19],[20,20,21,21,22,23,24,25]];
function pdeck(st){ const k=st.id-1; const o=owned(k).map(id=>A.CARD[id]).filter(c=>A.STRONG[c.cat]!==undefined);
  const sc=c=>(A.STRONG[c.cat]===st.cat?100:0)-(A.STRONG[st.cat]===c.cat?100:0)+c.r*10+(c.a+c.h)/100;
  const lv=PLV[st.area][st.i]; return o.sort((a,b)=>sc(b)-sc(a)).slice(0,8).map(c=>({id:c.id,lvl:lv,star:Math.min(5,Math.ceil(lv/5))})); }
for(const st of A.STAGES){ const o=A.stageDeck(st), hp=A.stageHp(st); let w=0,s=0; const N=250; for(let i=0;i<N;i++){ const g=run(pdeck(st),o,hp); if(g.w){w++;s+=g.s;} }
  const p=pdeck(st); console.log(((st.boss?'*':' ')+String(st.id).padStart(2)+' '+st.n).padEnd(28)+(Math.round(w/N*100)+'%').padStart(5)+(w?(s/w).toFixed(1):'-').padStart(5)+'  Spieler L'+p[0].lvl+' '+p.length+'K  Gegner '+o.length+'x L'+o[0].lvl+' HP'+hp+'  '+p.map(c=>c.id.slice(0,5)).join(','));
}
console.log('\nKarten:'); A.BASE.forEach(c=>process.stdout.write(c.id.slice(0,8)+' '+c.a+'/'+c.h+'  ')); console.log();
