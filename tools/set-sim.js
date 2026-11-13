const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8').split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const A=new Function(src+';return {BASE,SETS,newBattle,simulate};')();
const sets=Object.keys(A.SETS), L=+process.argv[3]||10;
const deck=s=>A.BASE.filter(c=>c.set===s).map(c=>({id:c.id,lvl:L,star:Math.ceil(L/5)}));
const tot={}; sets.forEach(s=>tot[s]=0);
for(const a of sets) for(const b of sets){ if(a===b) continue; let w=0; const N=60; for(let i=0;i<N;i++){ const B=A.simulate(A.newBattle(deck(a),deck(b))); if(B.over==='p') w++; } tot[a]+=w/N; }
sets.forEach(s=>console.log(s.padEnd(11),Math.round(tot[s]/(sets.length-1)*100)+'%'));
console.log(A.BASE.length,'Karten');
