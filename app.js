/* ====== Wirtschaft ======
   Gold: aus Siegen, Truhen, Album und Saison. Kauft alle Truhen und Aufwertungen.
   Glutsteine: kaufen nur Aussehen (Spieltische). Hier dockt später Echtgeld an (buyIAP). Truhen, Karten und Sondermotive gibt es nie für Echtgeld. */
const CCOL={feuer:['#f6a04a','#d8562a','#5c1c0e'],wasser:['#6fc6dc','#2c88a8','#0d3344'],erde:['#a9cf6a','#62993a','#1e3a14'],schatten:['#b08ad6','#7c52a3','#261538'],licht:['#ffe08a','#c9962a','#4a3a12']};
const SCOL=s=>SETS[s].col||CCOL[SETS[s].cat][1];
const setCats=x=>SETS[x].cats.map(c=>CATS[c]).join(' & ');
const CHESTS={
  holz:{n:'Bronzetruhe',slots:3,gold:[30,60],price:300,src:'Jeder 5. Arena-Sieg'},
  silber:{n:'Silbertruhe',slots:4,gold:[80,150],price:800,src:'Tagesaufgaben'},
  gold:{n:'Goldtruhe',slots:5,gold:[200,350],price:2000,src:'Endgegner, Liga-Aufstieg'}
};
/* Seltenheit der Kreaturen nach Spielerlevel: Stützpunkte bei Level 1, 10, 20 und 30, dazwischen gleichmäßig. Ab 30 fest. */
const CHEST_ODDS={
  holz:[[1,[95,5,0,0]],[10,[85,13,2,0]],[20,[77,18,4,1]],[30,[70,22,7,1]]],
  silber:[[1,[85,15,0,0]],[10,[68,26,6,0]],[20,[55,31,11,3]],[30,[45,35,15,5]]],
  gold:[[1,[65,30,5,0]],[10,[45,38,15,2]],[20,[30,41,23,6]],[30,[20,40,28,12]]]
};
function chestOdds(type,lv){
  const P=CHEST_ODDS[type]; lv=lv||S.plvl; if(lv<=P[0][0]) return P[0][1].slice(); if(lv>=P[P.length-1][0]) return P[P.length-1][1].slice();
  for(let i=0;i<P.length-1;i++){ const [a,x]=P[i],[b,y]=P[i+1]; if(lv<=b){ const t=(lv-a)/(b-a), o=x.map((v,k)=>v+(y[k]-v)*t), r=o.map(Math.round); r[0]+=100-r.reduce((u,v)=>u+v,0); return r; } }
}
/* Was eine Truhenkarte sein kann. Mindestens eine Kreatur, Gold höchstens einmal. */
const SLOT_W={kreatur:55,gegenstand:35,gold:10};
/* Gegenstandsqualität je Truhe: [Qualität, Gewicht]. Menge je Qualität. */
const CHEST_Q={holz:[[0,85],[1,15]],silber:[[0,50],[1,45],[2,5]],gold:[[1,50],[2,42],[3,8]]}, Q_AMOUNT=[[3,5],[2,4],[1,3],[1,1]];
/* Mehrfachkarten: in besseren Truhen gibt es eine Kreatur manchmal doppelt oder dreifach. */
const MULTI={silber:[[2,.15]],gold:[[3,.08],[2,.25]]};
const GEM_CHANCE=.02, GEM_FIND=[5,10];
const SKIN_CHANCE=.03, LOCKED_CHANCE=.02, STAR_WEIGHT=[0,1,.7,.45,.25,.1];
/* Verbessern (Stern): Doppelte + Gold. Leveln: Gegenstände passend zur Seltenheit + Gold, steigt mit jedem Level. */
const STAR_UP={2:{d:3,g:200},3:{d:6,g:600},4:{d:12,g:1500},5:{d:24,g:4000}}, DUP_GOLD=[15,30,70,160];
function lvlCost(L){ return {n:2+Math.floor(L*.8),g:20+15*L}; }
const ITEM_PRE={feuer:'Glut',wasser:'Gischt',erde:'Wurzel',schatten:'Nacht',licht:'Sonnen'}, ITEM_Q=['splitter','kristall','kern','herz'];
function itemName(cat,q){ return ITEM_PRE[cat]+ITEM_Q[q]; }
const SKIP_CHANCE={holz:.05,silber:.1,gold:.2};
/* Spielerlevel: Erfahrung aus Kämpfen und Tagesaufgaben. Höheres Level, bessere Kreaturen in Truhen. */
const PMAX=40, XP={win:15,star:5,arena:10,lose:2,daily:30};
function xpNeed(L){ return 80+40*(L-1); }
/* Kartenrücken: rein optisch, für Glutsteine. */
const BACKS={standard:{n:'Glutstein',p:0},abyss:{n:'Tiefsee',p:40},schmiede:{n:'Zwergenschmiede',p:40},mangrove:{n:'Mangroven',p:40},daemmerung:{n:'Dämmerung',p:40},totenwald:{n:'Totenwald',p:40},erwachen:{n:'Das Erwachen',p:40},kristall:{n:'Kristallsee',p:40},raeder:{n:'Räderwerk',p:40},
  glut:{n:'Glut',p:40},flut:{n:'Flut',p:40},hain:{n:'Hain',p:40},nacht:{n:'Nacht',p:40},sonne:{n:'Sonne',p:40},luft:{n:'Wolkenhimmel',p:40},
  bruecke:{n:'Brückenstadt',p:40},perle:{n:'Perlhafen',p:40},variete:{n:'Varieté',p:40},wueste:{n:'Wüstensand',p:40},orkan:{n:'Orkanflotte',p:40},
  champion:{n:'Champion',p:0,earn:'Erreiche die Glutliga'}};
/* Der Champion-Rücken ist nicht käuflich: er gehört dir, sobald du einmal die Glutliga erreicht hast. */
function champCheck(){ if(S.league>=4&&!S.backs.includes('champion')) S.backs.push('champion'); }
function backSrc(k){ return k==='standard'?'bilder/rueckseite.jpg':`bilder/ruecken-${k}.jpg`; }
const GEM_PROMO=20, GEM_BOSS=10, WIN_CHEST_EVERY=5, REPLAY_SHARE=.2, THREE_STAR_BONUS=50, HERO_GOLD=1.5, ALBUM_REWARD={gold:300,gems:15};
const SEASON_START=Date.UTC(2026,10,2), SEASON_DAYS=14;
/* Spieltische: Grundtisch gratis, weitere Farben günstig mit denselben Effekten, Thementische teurer mit eigenen Effekten und Geräuschen. */
const THEMES={
  tanne:{n:'Waldgrün',img:'bilder/tisch-gruen.jpg',c:['#173430','#0c1e1c','#234a43'],p:0,fx:'basis'},
  schiefer:{n:'Nachtblau',img:'bilder/tisch-blau.jpg',c:['#1c2a3d','#0d1521','#2b405c'],p:30,fx:'basis'},
  wein:{n:'Weinrot',img:'bilder/tisch-rot.jpg',c:['#3b1a24','#1e0b11','#572836'],p:30,fx:'basis'},
  asche:{n:'Aschgrau',img:'bilder/tisch-asche.jpg',c:['#2d2b29','#151413','#44403b'],p:30,fx:'basis'},
  schmiede:{n:'Schmiede',img:'bilder/tisch-schmiede.jpg',c:['#2a1a12','#140a06','#4a2a18'],p:100,fx:'schmiede'},
  tiefsee:{n:'Tiefsee',img:'bilder/tisch-tiefsee.jpg',c:['#0f2c30','#06161a','#18454b'],p:100,fx:'tiefsee'},
  totenwald:{n:'Totenwald',img:'bilder/tisch-totenwald.jpg',c:['#2a2016','#120d08','#3d3020'],p:100,fx:'totenwald'},
  kristall:{n:'Kristallsee',img:'bilder/tisch-kristall.jpg',c:['#123038','#08181d','#1d4a55'],p:100,fx:'kristall'},
  wolken:{n:'Wolkendeck',img:'bilder/tisch-wolken.jpg',c:['#2e1e14','#160e08','#4a3020'],p:100,fx:'wolken'},
  werkstatt:{n:'Werkstatt',img:'bilder/tisch-werkstatt.jpg',c:['#2a1810','#140a06','#46281a'],p:100,fx:'werkstatt'}
};
const TFX={
  basis:{d:'Staub im Kerzenlicht, Kaminknistern'},
  schmiede:{d:'Funken und Glut, Hammerschläge am Amboss'},
  tiefsee:{d:'Luftblasen und Lichtstrahlen, Blubbern aus der Tiefe'},
  totenwald:{d:'Bodennebel und Geisterlichter, Wind und knarzende Äste'},
  kristall:{d:'Glitzernde Lichtpunkte, Plätschern und Kristallklang'},
  wolken:{d:'Ziehende Wolken, Wind, knarrende Taue und ein ferner Propeller'},
  werkstatt:{d:'Dampfschwaden und Zahnräder, Uhrwerkticken und Zischen'}
};
const IAP=[{id:'gs80',gems:80,price:'0,99 €'},{id:'gs500',gems:500,price:'4,99 €'},{id:'gs1200',gems:1200,price:'9,99 €'}];
function buyIAP(id){ /* Hier später den Zahlungsanbieter anbinden und bei Erfolg S.gems erhöhen. */ toast('Echtgeld-Käufe sind im Prototyp ausgeschaltet.'); }
const TASKS=[
  {k:'arenaWin',g:3,t:'Gewinne 3 Duelle in der Arena'},
  {k:'win',g:4,t:'Gewinne 4 Kämpfe'},
  {k:'kill',g:12,t:'Besiege 12 gegnerische Karten'},
  {k:'strong',g:6,t:'Triff 6-mal mit Elementvorteil'},
  {k:'gold',g:150,t:'Verdiene 150 Gold'},
  {k:'three',g:2,t:'Gewinne 2 Kämpfe mit 3 Sternen'}
];
/* Bilder: Karte → Datei. Sondermotiv: id-s. Nur Sondermotive mit eigenem Bild können in Truhen liegen. */
const ART={}; BASE.forEach(c=>ART[c.id]=`bilder/${c.id}.jpg`);
/* Sondermotive je Karte: Anzahl der Motive. Motiv 1 = id-s.jpg, Motiv 2 = id-s2.jpg. Jedes Motiv wird einzeln in Truhen gefunden. */
const SKINS={}; ['funkenwicht','glutwolf','brandbogner','flammenhexe','schlackenriese','aschendrache','tuempelgeist','gezeitenwache','perlentaucherin','nebelheilerin','sturmrufer','leviathan',
 'moosling','dornenhirsch','wurzelhueter','rudelfuehrerin','alteiche','waldkoenigin','nachtfalter','grabkriecher','schattendolch','kraehenschwarm','seelenhaendlerin','irrlicht','sonneneinhorn','sonnenloewe','lichtmagier','seraphin'].forEach(id=>SKINS[id]=1);
['speerwerferin','falknerin','schildmaid','pantherreiterin','kriegspriesterin','amazonenkoenigin','kryoschlaeferin','sheriff','kopfgeldjaegerin','kutschenraeuberin','runenjaegerin','sternenschmugglerin','strassenhackerin','schattenagentin'].forEach(id=>SKINS[id]=1);
SKINS.mitternachtsfuerstin=2; SKINS.lichtritter=2; SKINS.leuchtturmwaerterin=1;
/* Station Null: Sondermotive aus Folge 1. Sie gibt es nur in der Geschichte (STORY_REW), nicht in Truhen. */
['wartungsdrohne','sporenbrut','infizierter','androidin','reaktording'].forEach(id=>SKINS[id]=1); SKINS.kryoschlaeferin=2;
SKINS.doktorlind=1; /* Gegner-Karte: Motiv kommt mit dem heroisch geschafften Gebiet (heroSkin in AREAS). */
const STORY_ONLY={wartungsdrohne:[1],sporenbrut:[1],infizierter:[1],androidin:[1],reaktording:[1],kryoschlaeferin:[2],doktorlind:[1]};
['wahrsagerin','pilzhueterin','ghul','netzflickerin','fischerin','zirkusdirektor','fliegerass','totenherrin','dschinn','abgrundkoenigin','messingkoloss','runenschmiedin','messerwerferin','sphinx','geisterschiff','erwachter','schwanenritter','enterkapitaen','eklipsenwaechter','vampirjaegerin','himmelsschiff','mangrovenriese','tiefenkrake'].forEach(id=>SKINS[id]=1);
const SKIN_NAMES={mitternachtsfuerstin:['Fürstin','Fürst'],lichtritter:['Ritter','Ritterin'],kryoschlaeferin:['Ansteckung','Der Sprung']};
for(const id in SKINS) for(let v=1;v<=SKINS[id];v++) ART[id+'-s'+(v>1?v:'')]=`bilder/${id}-s${v>1?v:''}.jpg`;
function skinSrc(id,v){ return v&&ART[id+'-s'+(v>1?v:'')]||ART[id]; }
function skinName(id,v){ return (SKIN_NAMES[id]&&SKIN_NAMES[id][v-1])||'Motiv '+v; }
/* Freie Sets: jede Karte kommt erst in Truhen, wenn ihr Element in der Kampagne erreicht ist. Feuer nach 3 Gefechten, sonst nach dem Endgegner des Gebiets. */
const ELEM_GATE={feuer:3,wasser:BOSS_ID(1),erde:BOSS_ID(2),schatten:BOSS_ID(3),licht:BOSS_ID(4)};
function elemOpen(cat){ return !!(S.stars[ELEM_GATE[cat]]>0); }
const UNLOCK_AT={}; STAGES.forEach(st=>{ if(st.unlock) UNLOCK_AT[st.unlock]=st.id; });

const H1=['Kralle','Luna','Moritz','Sturm','Nacht','Eisen','Fuchs','Rabe','Pixel','Brumm','Zwerg','Glut','Mira','Tobi','Hexe','Wolf','Kaktus','Nebel','Rost','Jule','Okan','Finn','Lea','Bjarne','Sina','Dachs','Keks','Wicht','Ritter','Motte'];
const H2=['','_77','_92','07','_xD','3000','HD','_tv','2k','Lord','chen','_HH','_M','42','_gg','lein','XL','_01','23','Prime'];
const ROM=['','I','II','III','IV','V','VI'], KEY='glutstein-save-v6';
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString('de-DE');
let S, tab='map', fCat='alle', fSet='alle', shopTab='truhen';
let B=null, ctx=null, infoCard=null, infoT=0, narr='', narrLog=[], result=null, skip=false, forfeit=false, battleId=0, tipDone=null;

function mkTable(lg){
  const L=LEAGUES[lg], hi=LEAGUES[lg+1]?LEAGUES[lg+1].lo+40:L.lo+800, r=rng((Math.random()*2147483647)|0), used=new Set(), rivals=[];
  while(rivals.length<20){
    const n=H1[Math.floor(r()*H1.length)]+H2[Math.floor(r()*H2.length)]; if(used.has(n)) continue; used.add(n);
    const t=Math.round(L.lo+r()*(hi-L.lo)); rivals.push({n,t,s:1+Math.floor(r()*2e9),p:+(t/1500).toFixed(3)});
  }
  return {lg,rivals};
}
function rivalLvl(r){ return Math.max(1,Math.min(PMAX,Math.round(3+r.t/40+(r.s%5)))); }
function okTable(t){ return t&&typeof t==='object'&&LEAGUES[t.lg]&&Array.isArray(t.rivals)&&t.rivals.length>=3&&t.rivals.every(r=>r&&typeof r.n==='string'&&isFinite(r.t)&&isFinite(r.s)&&isFinite(r.p)); }
function seasonIdx(){ return Math.floor((Date.now()-SEASON_START)/(SEASON_DAYS*864e5)); }
function fresh(){
  const decks=[STARTER.slice(),STARTER.slice(),STARTER.slice()];
  return {v:6,gold:150,gems:0,skips:0,items:Object.fromEntries(Object.keys(CATS).map(c=>[c,[0,0,0,0]])),chests:[],cards:Object.fromEntries(STARTER.map(id=>[id,{lvl:1,star:1,dup:0}])),decks,di:0,unlocked:[],setsOpen:[],stars:{},hstars:{},foeSets:[],campV:2,skinNew:{},hero:'sammler',heroes:FREE_HEROES.slice(),sex:'m',skins:{},skinOn:{},album:{},seen:{},stat:{fights:0,kills:0,best:null},lastSave:Date.now(),remind:'',ch:{wk:0,prog:{},all:0},chDecks:{},xp:0,plvl:1,back:'standard',backs:['standard'],
  vol:{m:.6,s:.8,a:.45,v:1},fxOff:false,muted:false,speed:1,opened:0,name:'Neuling_'+(100+Math.floor(Math.random()*900)),tr:0,league:0,aw:0,al:0,wins:0,theme:'tanne',themes:['tanne'],
  table:mkTable(0),daily:null,uid:Math.floor(Math.random()*1e9),tut:true,tipSeen:{},ach:{},flags:{},season:seasonIdx(),seasonBest:0,seasonMsg:null};
}
function cleanDeck(d,cards){ return [...new Set(Array.isArray(d)?d:[])].filter(id=>cards[id]).slice(0,DECK_MAX); }
function sane(j){
  const f=fresh(), s=Object.assign({},f,j); s.v=6;
  s.cards=j.cards&&typeof j.cards==='object'?j.cards:f.cards;
  for(const id in s.cards){ if(!CARD[id]) delete s.cards[id]; else{ const o=s.cards[id]; o.star=Math.min(MAXSTAR,Math.max(1,o.star|0)); o.lvl=Math.min(o.star*5,Math.max(1,o.lvl|0)); o.dup=Math.max(0,o.dup|0); } }
  STARTER.forEach(id=>{ if(!s.cards[id]) s.cards[id]={lvl:1,star:1,dup:0}; });
  s.items=Object.fromEntries(Object.keys(CATS).map(c=>[c,[0,1,2,3].map(q=>Math.max(0,((j.items||{})[c]||[])[q]|0))]));
  s.chests=(Array.isArray(j.chests)?j.chests:[]).filter(x=>x&&CHESTS[x.type]).slice(0,50);
  s.decks=(Array.isArray(j.decks)&&j.decks.length===3?j.decks:f.decks).map(d=>cleanDeck(d,s.cards));
  s.di=[0,1,2].includes(j.di)?j.di:0;
  s.unlocked=(Array.isArray(j.unlocked)?j.unlocked:[]).filter(id=>CARD[id]);
  s.setsOpen=(Array.isArray(j.setsOpen)?j.setsOpen:[]).filter(x=>SETS[x]);
  ['gold','gems','skips','opened','tr','aw','al','wins','seasonBest'].forEach(k=>s[k]=Math.max(0,s[k]|0));
  ['stars','hstars','skins','skinOn','album','tipSeen','ach','flags','seen'].forEach(k=>s[k]=j[k]&&typeof j[k]==='object'?j[k]:{});
  s.league=Math.min(LEAGUES.length-1,Math.max(leagueOf(s.tr),s.league|0));
  s.speed=[1,2,4].includes(s.speed)?s.speed:1;
  const cl=v=>Math.min(1,Math.max(0,+v||0));
  s.vol=s.vol&&typeof s.vol==='object'?{m:cl(s.vol.m),s:cl(s.vol.s),a:s.vol.a==null?f.vol.a:cl(s.vol.a),v:s.vol.v==null?f.vol.v:cl(s.vol.v)}:f.vol;
  s.fxOff=!!s.fxOff; if(s.ev&&(!SETS[s.ev.set]||!Array.isArray(s.ev.pts)||!Array.isArray(s.ev.tasks))) s.ev=null; if(!Array.isArray(s.foeSets)) s.foeSets=[];
  if(s.league>=4&&Array.isArray(s.backs)&&!s.backs.includes('champion')) s.backs.push('champion');
  s.heroes=(Array.isArray(s.heroes)?s.heroes:[]).filter(k=>HEROES[k]); FREE_HEROES.slice().reverse().forEach(k=>{ if(!s.heroes.includes(k)) s.heroes.unshift(k); }); if(!s.heroes.includes(s.hero)) s.hero='sammler'; if(s.sex!=='w') s.sex=s.hero==='sammlerin'?'w':'m';
  /* Kampagne 16 statt 8: jedes alte Gefecht zählt für die beiden neuen an seiner Stelle. */
  if((s.campV|0)<2){ ['stars','hstars'].forEach(k=>{ const o=s[k]||{}, n={}; for(const id in o){ const x=+id-1, a=Math.floor(x/8), j=x%8; if(a<5){ n[a*16+2*j+1]=o[id]; n[a*16+2*j+2]=o[id]; } } s[k]=n; }); s.campV=2; }
  s.stat=Object.assign({fights:0,kills:0,best:null},s.stat||{}); if(!s.lastSave) s.lastSave=Date.now(); if(typeof s.remind!=='string') s.remind='';
  if(!s.ch||typeof s.ch!=='object') s.ch={wk:0,prog:{},all:0}; if(!s.chDecks||typeof s.chDecks!=='object') s.chDecks={};
  s.plvl=Math.min(PMAX,Math.max(1,s.plvl|0)); s.xp=Math.max(0,s.xp|0);
  s.backs=(Array.isArray(s.backs)?s.backs:[]).filter(b=>BACKS[b]); if(!s.backs.includes('standard')) s.backs.unshift('standard'); if(!s.backs.includes(s.back)) s.back='standard';
  /* Sondermotive: früher 1 = besessen, jetzt Liste der gefundenen Motive. */
  for(const id in s.skins){ const v=s.skins[id]; s.skins[id]=Array.isArray(v)?v.filter(x=>x>=1&&x<=(SKINS[id]||0)):(v&&SKINS[id]?[1]:[]); if(!s.skins[id].length) delete s.skins[id]; }
  if(!s.skinNew||typeof s.skinNew!=='object') s.skinNew={};
  for(const id in s.skinOn){ const v=s.skinOn[id]|0; s.skinOn[id]=(s.skins[id]||[]).includes(v)?v:0; }
  s.name=(typeof s.name==='string'&&s.name.trim()?s.name.trim():f.name).slice(0,16);
  s.themes=(Array.isArray(s.themes)?s.themes:[]).filter(t=>THEMES[t]); if(!s.themes.includes('tanne')) s.themes.unshift('tanne');
  if(!s.themes.includes(s.theme)) s.theme='tanne';
  if(!okTable(s.table)||s.table.lg!==leagueOf(s.tr)) s.table=mkTable(leagueOf(s.tr));
  if(!Number.isFinite(s.season)) s.season=seasonIdx();
  /* Neue Story-Momente: was schon gespielt ist, gilt als gesehen (zum Nachholen gibt es „Geschichte ansehen“). */
  if(!s.seen.story2){ if(s.seen.intro) BEATS.forEach(([id,k])=>{ if(s.stars[id]) s.seen[k]=1; }); s.seen.story2=1; }
  return s;
}
const deck=()=>S.decks[S.di];
function load(){ try{ const j=JSON.parse(localStorage.getItem(KEY)); if(j&&j.v===6) return sane(j); }catch(e){} return fresh(); }
function persist(){ checkAch(); try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function applyTheme(){ const t=THEMES[S.theme], st=document.documentElement.style; st.setProperty('--ruecken',`url(${backSrc(S.back)})`); st.setProperty('--tuch',t.c[0]); st.setProperty('--tuch-tief',t.c[1]); st.setProperty('--tuch-hell',t.c[2]); st.setProperty('--tisch',t.img?`url("${t.img}")`:'none'); if(typeof ambApply==='function') ambApply(); }
function addGold(n){ if(n<=0) return; S.gold+=n; track('gold',n); }
/* Erfahrung gutschreiben. Gibt die Aufstiege zurück, damit sie angezeigt werden können. */
let LVUP=[];
function addXp(n){
  if(S.plvl>=PMAX||n<=0) return; S.xp+=n;
  while(S.plvl<PMAX&&S.xp>=xpNeed(S.plvl)){ S.xp-=xpNeed(S.plvl); S.plvl++; const g=50*S.plvl, chest=S.plvl%5===0; addGold(g); if(chest) S.chests.push({type:'silber'}); LVUP.push({lv:S.plvl,g,chest}); }
  if(S.plvl>=PMAX) S.xp=0;
}
function showLvUp(){
  if(!LVUP.length||B||SQ||!$('#sheet').hidden) return; const u=LVUP.shift();
  openSheet(`<div class="lvup"><p class="eyebrow">Aufstieg</p><b class="lvnum">${u.lv}</b><h2>Kartenbinder-Level ${u.lv}</h2><p class="r-line"><span class="coin"></span>+${u.g} Gold</p>${u.chest?'<p class="r-line"><img src="bilder/truhe-silber.png" alt="" width="34" height="34">Silbertruhe <small>liegt im Laden</small></p>':''}<p class="muted">In Truhen stecken jetzt öfter bessere Kreaturen.</p><button class="btn primary" data-act="close">Weiter</button></div>`);
  sfx('coin'); jingle('aufstieg');
}

/* ====== Sammlung und Truhen ======
   Freigeschaltet: Startkarten, Kampagnenkarten, und nach jedem Endgegner das ganze Set seines Gebiets. Gesperrte Karten kommen nur selten.
   Je höher eine Karte schon aufgewertet ist, desto seltener wird sie gezogen. */
function isUnlocked(id){ const c=CARD[id]; if(SETS[c.set].ev) return !!S.cards[id]; if(SETS[c.set].foe) return false; if(c.r===0) return true; if(SETS[c.set].free) return elemOpen(c.cat); return STARTER.includes(id)||S.unlocked.includes(id)||S.setsOpen.includes(c.set); }
function needLeft(o){ let n=0; for(let s=o.star+1;s<=MAXSTAR;s++) n+=STAR_UP[s].d; return n; }
function ownSkins(id){ return Array.isArray(S.skins[id])?S.skins[id]:[]; }
function grant(id,skin){
  const o=S.cards[id]; let kind;
  if(!o){ S.cards[id]={lvl:1,star:1,dup:0}; kind='neu'; }
  else if(o.dup>=needLeft(o)){ const g=DUP_GOLD[CARD[id].r]; addGold(g); kind='gold'; }
  else{ o.dup++; kind='dup'; }
  const r={id,kind}; if(kind==='gold') r.gold=DUP_GOLD[CARD[id].r];
  if(skin){ const own=ownSkins(id), free=[]; for(let v=1;v<=(SKINS[id]||0);v++) if(!own.includes(v)&&!(STORY_ONLY[id]||[]).includes(v)) free.push(v);
    if(free.length){ const v=free[Math.floor(Math.random()*free.length)]; S.skins[id]=own.concat(v).sort(); S.skinOn[id]=v; (S.skinNew=S.skinNew||{})[id]=1; r.skin=v; } }
  return r;
}
function rollRar(odds){ const v=Math.random()*100; let a=0; for(let i=0;i<4;i++){ a+=odds[i]; if(v<a) return i; } return 3; }
function weighted(pool){
  const w=pool.map(c=>{ const o=S.cards[c.id]; return o?STAR_WEIGHT[o.star]:1; }), sum=w.reduce((a,b)=>a+b,0); let v=Math.random()*sum;
  for(let i=0;i<pool.length;i++){ v-=w[i]; if(v<=0) return pool[i]; } return pool[pool.length-1];
}
/* Normale Truhen: keine Gegner- und keine Event-Karten. */
const NORMAL=BASE.filter(c=>!SETS[c.set].foe&&!SETS[c.set].ev);
/* Truhen aus einem Modus ziehen die Sets dieses Modus dreimal so oft. Alles bleibt überall ziehbar. */
const SRC_SETS={kampagne:['abyss','schmiede','variete','daemmerung','totenwald'],arena:['luft','bruecke','raeder','wueste'],heraus:['kristall','erwachen','mangrove','orkan','perle']};
const SRC_N={kampagne:'Kampagne',arena:'Arena',heraus:'Herausforderung'}, SRC_ICON={kampagne:'⚑',arena:'⚔',heraus:'✦'}, SRC_BOOST=3;
function setSrc(set){ return Object.keys(SRC_SETS).find(k=>SRC_SETS[k].includes(set))||null; }
function srcPick(pool,src){ if(!src||!SRC_SETS[src]) return weighted(pool); const w=pool.map(c=>SRC_SETS[src].includes(c.set)?SRC_BOOST:1), sum=w.reduce((a,b)=>a+b,0); let v=Math.random()*sum;
  for(let i=0;i<pool.length;i++){ v-=w[i]; if(v<=0) return pool[i]; } return pool[pool.length-1]; }
function drawCard(odds,src){
  const locked=NORMAL.filter(c=>!isUnlocked(c.id));
  if(locked.length&&Math.random()<LOCKED_CHANCE){ const r=rollRar(odds); for(let d=0;d<=r;d++){ const pool=locked.filter(c=>c.r===r-d); if(pool.length) return srcPick(pool,src).id; } }
  let r=rollRar(odds), pool=[];
  for(let d=0;d<4&&!pool.length;d++){ pool=NORMAL.filter(c=>isUnlocked(c.id)&&c.r===r-d); if(!pool.length) pool=NORMAL.filter(c=>isUnlocked(c.id)&&c.r===r+d); }
  return srcPick(pool.length?pool:NORMAL.filter(c=>isUnlocked(c.id)),src).id;
}
function pick(list){ const sum=list.reduce((a,x)=>a+x[1],0); let v=Math.random()*sum; for(const x of list){ v-=x[1]; if(v<=0) return x[0]; } return list[list.length-1][0]; }
function rnd2(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
/* Truhe öffnen: 3/4/5 Karten. Jede Karte ist Kreatur, Gegenstand oder Gold; selten Schnellsieg-Rolle oder Glutsteine. */
/* opt.ev: Eventtruhe – normale Karten mit Bronzetruhen-Chancen, keine Mehrfachkarten, Gegenstände eine Stufe schwächer. */
function openChest(type,slots,opt){
  opt=opt||{}; const C=CHESTS[type], odds=chestOdds(opt.ev?'holz':type), kinds=[]; track('chest');
  for(let i=0;i<(slots||C.slots);i++){ const opts=Object.entries(SLOT_W).filter(([k])=>k!=='gold'||!kinds.includes('gold')); kinds.push(pick(opts)); }
  if(!kinds.includes('kreatur')) kinds[Math.floor(Math.random()*kinds.length)]='kreatur';
  const notK=()=>kinds.map((k,i)=>k!=='kreatur'?i:-1).filter(i=>i>=0);
  if(Math.random()<SKIP_CHANCE[type]){ const f=notK(); if(f.length) kinds[f[Math.floor(Math.random()*f.length)]]='rolle'; else if(kinds.filter(k=>k==='kreatur').length>1) kinds[kinds.length-1]='rolle'; }
  if(type==='gold'&&Math.random()<GEM_CHANCE){ const f=kinds.map((k,i)=>k!=='kreatur'&&k!=='rolle'?i:-1).filter(i=>i>=0); if(f.length) kinds[f[0]]='steine'; else if(kinds.filter(k=>k==='kreatur').length>1) kinds[kinds.lastIndexOf('kreatur')]='steine'; }
  const cards=kinds.map(k=>{
    if(k==='kreatur'){ const id=drawCard(odds,opt.src); if(!S.stat.best||CARD[id].r>CARD[S.stat.best].r) S.stat.best=id;
      let m=1, v=Math.random(); for(const [n,p] of (opt.ev?[]:MULTI[type]||[])){ if(v<p){ m=n; break; } v-=p; }
      const g=Object.assign({t:'kreatur',mult:m},grant(id,!!SKINS[id]&&Math.random()<SKIN_CHANCE)); for(let q=1;q<m;q++){ const x=grant(id,false); if(x.gold) g.gold=(g.gold||0)+x.gold; } return g; }
    if(k==='gegenstand'){ const q=Math.max(0,pick(CHEST_Q[type])-(opt.ev?1:0)), cat=Object.keys(CATS)[Math.floor(Math.random()*5)], n=rnd2(...Q_AMOUNT[q]); S.items[cat][q]+=n; return {t:'gegenstand',cat,q,n}; }
    if(k==='gold'){ const n=rnd2(...C.gold); addGold(n); return {t:'gold',n}; }
    if(k==='rolle'){ S.skips++; return {t:'rolle',n:1}; }
    const n=rnd2(...GEM_FIND); S.gems+=n; return {t:'steine',n};
  });
  S.opened++;
  return {type,cards};
}
/* Gegenstand eines Gefechts: Element des Gebiets, Qualität nach Gefecht (1–3 Splitter, 4–5 Kristall, 6–7 Kern, Endgegner Herz). Heroisch doppelt. */
function stageItem(st,hero){ return {cat:st.cat,q:st.i<5?0:st.i<10?1:st.i<15?2:3,n:hero?2:1}; }
function giveItems(list){ list.forEach(x=>S.items[x.cat][x.q]+=x.n); }
function canLevel(id){ const o=S.cards[id]; if(!o||o.lvl>=o.star*5) return false; const c=lvlCost(o.lvl), d=CARD[id]; return S.items[d.cat][d.r]>=c.n&&S.gold>=c.g; }
function canStar(id){ const o=S.cards[id]; if(!o||o.star>=MAXSTAR) return false; const u=STAR_UP[o.star+1]; return o.dup>=u.d&&S.gold>=u.g; }
function canUp(id){ return canLevel(id)||canStar(id); }
function deckObjs(){ return deck().map(id=>({id,lvl:S.cards[id].lvl,star:S.cards[id].star,skin:skinOn(id)})); }
function deckLim(){ const d=deckObjs(); return {n:d.length,r:Math.max(...d.map(c=>CARD[c.id].r)),l:Math.max(1,Math.round(d.reduce((a,c)=>a+c.lvl,0)/d.length))}; }
function byDist(){ return S.table.rivals.slice().sort((a,b)=>Math.abs(a.t-S.tr)-Math.abs(b.t-S.tr)); }
function rivalDeck(r){ return botDeck(r.s,r.p,S.table.lg===0?deckLim():null); }
function drift(skipRival){ const L=LEAGUES[S.table.lg], hi=LEAGUES[S.table.lg+1]?LEAGUES[S.table.lg+1].lo+160:L.lo+1000; S.table.rivals.forEach(r=>{ if(r!==skipRival) r.t=Math.min(hi,Math.max(L.lo,r.t+Math.round((Math.random()-.45)*24))); }); }

/* ====== Tagesaufgaben, Erfolge, Saison ====== */
function dayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function daily(){
  const k=dayKey(); if(S.daily&&S.daily.day===k) return S.daily;
  const r=rng(hash(k+':'+S.uid)), pool=TASKS.slice(), sets=[...new Set(Object.keys(S.cards).map(id=>CARD[id].set))];
  sets.forEach(x=>pool.push({k:'field:'+x,g:6,t:`Bringe 6 ${SETS[x].n}-Karten aufs Feld`}));
  const tasks=[]; while(tasks.length<3&&pool.length){ const t=pool.splice(Math.floor(r()*pool.length),1)[0]; tasks.push({k:t.k,g:t.g,t:t.t,p:0}); }
  S.daily={day:k,tasks,claimed:false}; return S.daily;
}
function track(k,n){ evTrack(k,n); const d=daily(); d.tasks.forEach(t=>{ if(t.k===k&&t.p<t.g) t.p=Math.min(t.g,t.p+(n||1)); }); }
function dailyDone(){ return daily().tasks.every(t=>t.p>=t.g); }
let pendingAch=[];
function flushAch(){ if(!pendingAch.length||!$('#sheet').hidden||B) return; toast(pendingAch.length===1?`Erfolg: ${pendingAch[0]} · abholen im Laden`:`${pendingAch.length} Erfolge · abholen im Laden`); pendingAch=[]; render(); }
function checkAch(){ if(!S) return; ACH.forEach(a=>{ if(!S.ach[a.id]){ let ok=false; try{ ok=a.ok(); }catch(e){} if(ok){ S.ach[a.id]=1; pendingAch.push(a.t); } } }); }
function achOpen(){ return ACH.filter(a=>S.ach[a.id]===1).length; }
function albumOpen(){ return Object.keys(SETS).filter(x=>allOf(x)&&!S.album[x]).length; }
function checkSeason(){
  const now=seasonIdx(); if(S.season===now) return;
  const best=Math.max(S.seasonBest,leagueOf(S.tr)), gems=5+5*best, gold=100*(best+1);
  S.gems+=gems; addGold(gold); S.tr=Math.floor(S.tr*.7); S.table=mkTable(leagueOf(S.tr)); S.season=now; S.seasonBest=leagueOf(S.tr);
  S.seasonMsg={best,gems,gold}; persist();
}
function seasonDaysLeft(){ const end=SEASON_START+(seasonIdx()+1)*SEASON_DAYS*864e5; return Math.max(1,Math.ceil((end-Date.now())/864e5)); }

/* ====== Musik und Töne ====== */
/* Musik: pro Bereich mehrere Stücke. Beim Betreten wird zufällig eins gewählt, danach wechseln sie sich ab. */
const POOLS={prolog:['prolog'],menue:['menue-2','menue'],karte:['karte','karte-2'],kampf:['kampf','kampf-2'],endgegner:['endgegner','endgegner-2'],arena:['arena','arena-2']}, LOOPS=[].concat(...Object.values(POOLS)), JINGLES=['sieg','niederlage','truhe','aufstieg'];
let AC=null, mOut=null, sOut=null, aOut=null, vOut=null, mDuck=null, AU={}, curLoop=null, curCat=null, wantLoop='karte', duckT=0, menuFirst=true;
function audioInit(){
  if(AC) return true;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    mOut=AC.createGain(); sOut=AC.createGain(); aOut=AC.createGain(); vOut=AC.createGain(); mDuck=AC.createGain(); mOut.connect(mDuck); mDuck.connect(AC.destination); vOut.connect(AC.destination); sOut.connect(AC.destination); aOut.connect(AC.destination); applyVol(); ambStart(); sampleLoad();
    LOOPS.concat(JINGLES).forEach(n=>{
      const a=new Audio('musik/'+n+'.mp3'); a.preload='auto'; a.setAttribute('playsinline','');
      const g=AC.createGain(); g.gain.value=0; AC.createMediaElementSource(a).connect(g); g.connect(mOut); AU[n]={a,g};
      if(LOOPS.includes(n)) a.addEventListener('ended',()=>{ if(curLoop===n&&curCat) playTrack(nextTrack(curCat,n)); });
      a.play().then(()=>{ if(n!==curLoop) a.pause(); }).catch(()=>{});
    });
    return true;
  }catch(e){ AC=null; return false; }
}
function applyVol(){ if(!AC) return; const t=AC.currentTime; mOut.gain.setTargetAtTime(S.muted?0:S.vol.m,t,.05); sOut.gain.setTargetAtTime(S.muted?0:S.vol.s,t,.05); aOut.gain.setTargetAtTime(S.muted?0:S.vol.a*.6,t,.3); vOut.gain.setTargetAtTime(S.muted?0:S.vol.v,t,.05); }
function fade(g,to,dur){ const t=AC.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(to,t+dur); }
function nextTrack(cat,cur){ const p=POOLS[cat]||[cat]; if(p.length<2) return p[0]; const o=p.filter(x=>x!==cur); return o[Math.floor(Math.random()*o.length)]; }
function playTrack(n){
  const old=curLoop&&AU[curLoop]; if(old&&curLoop!==n){ fade(old.g,0,.7); const oa=old.a; setTimeout(()=>{ if(curLoop!==oa._n) oa.pause(); },800); }
  const nu=AU[n]; if(!nu) return; nu.a._n=n; curLoop=n;
  try{ nu.a.currentTime=0; }catch(e){}
  nu.a.play().catch(()=>{}); fade(nu.g,1,.9);
}
function music(cat,restart){
  wantLoop=cat; if(!AC) return;
  if(curCat===cat&&!restart) return;
  curCat=cat;
  let n; if(cat==='menue'&&menuFirst){ n=POOLS.menue[0]; menuFirst=false; } else n=nextTrack(cat,curLoop);
  playTrack(n);
}
function stopMusic(){ if(!AC||!curLoop) return; const o=AU[curLoop]; fade(o.g,0,.5); const a=o.a; setTimeout(()=>a.pause(),600); curLoop=null; curCat=null; }
function jingle(n,keepDuck){
  if(!AC||!AU[n]) return; const j=AU[n]; try{ j.a.currentTime=0; }catch(e){} j.g.gain.value=1; j.a.play().catch(()=>{});
  if(curLoop&&!keepDuck){ const g=AU[curLoop].g; fade(g,.25,.2); clearTimeout(duckT); duckT=setTimeout(()=>{ if(curLoop) fade(AU[curLoop].g,1,.8); },(j.a.duration||4)*1000); }
}
function tabMusic(){ return menuOn?'menue':tab==='arena'?'arena':tab==='map'||tab==='event'?'karte':'menue'; }
function tone(f,d,type,vol,when,slide){
  const t=AC.currentTime+(when||0), o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g); g.connect(sOut); o.start(t); o.stop(t+d+.02);
}
/* Echte Geräusche (Ordner sfx/). Fallen auf die erzeugten Töne zurück, solange sie noch laden. */
const SAMPLES=['muenze','schlag','karte','truhe','tod','klick','aufwerten','nein','funkeln','held','heilung','faehigkeit'], SBUF={}, SLAST={};
function sampleLoad(){ SAMPLES.forEach(n=>fetch('sfx/'+n+'.mp3').then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(buf=>{ SBUF[n]=buf; }).catch(()=>{})); }
/* gap: Mindestabstand in Sekunden, damit sich schnelle Wiederholungen nicht stapeln. */
function sample(n,vol,rate,gap){ if(!AC||!SBUF[n]) return false; const t=AC.currentTime; if(gap&&SLAST[n]&&t-SLAST[n]<gap) return true; SLAST[n]=t;
  const src=AC.createBufferSource(), g=AC.createGain(); src.buffer=SBUF[n]; src.playbackRate.value=rate||1; g.gain.value=vol==null?1:vol; src.connect(g); g.connect(sOut); src.start(); return true; }
const SFX={
  tap:()=>sample('klick',.45,1,.04)||tone(620,.05,'triangle',.05), place:()=>sample('karte',.8,1,.05)||tone(240,.12,'triangle',.12,0,.6), hit:()=>sample('schlag',.6,1.05,.06)||tone(170,.1,'square',.06,0,.5),
  crit:()=>{ if(!sample('schlag',.9,.85,.06)) tone(220,.12,'square',.08,0,.4); tone(660,.08,'triangle',.04,.02); },
  die:()=>sample('tod',.7,1,.1)||tone(120,.25,'sawtooth',.06,0,.3), hero:()=>sample('held',.8,1,.15)||tone(90,.2,'sawtooth',.09,0,.5), heal:()=>sample('heilung',.6,1,.25)||tone(700,.18,'sine',.07,0,1.5),
  skill:()=>sample('faehigkeit',.45,1,.3), chest:()=>sample('truhe',.85)||tone(300,.15,'triangle',.08), up:()=>sample('aufwerten',.6)||SFX.coin(), need:()=>sample('nein',.5,1,.4),
  coin:()=>sample('muenze',.6,1,.08)||(tone(990,.08,'triangle',.07),tone(1480,.14,'triangle',.07,.07)),
  flip:()=>sample('karte',.7,1.1,.05)||(tone(500,.06,'triangle',.06),tone(900,.12,'sine',.05,.05)),
  rare1:()=>{ [660,880].forEach((f,i)=>tone(f,.25,'sine',.07,i*.09)); },
  rare2:()=>{ if(!sample('funkeln',.55)) [523,659,784,1047].forEach((f,i)=>tone(f,.35,'triangle',.07,i*.08)); },
  rare3:()=>{ if(!sample('funkeln',.75,.9)) [523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,.6,'triangle',.08,i*.07)); tone(80,.8,'sine',.18,0,.5); }
};
function sfx(n){ if(!AC||skip) return; try{ if(AC.state==='suspended') AC.resume(); SFX[n]&&SFX[n](); }catch(e){} }
document.addEventListener('pointerdown',()=>{ if(audioInit()){ if(AC.state==='suspended') AC.resume(); if(!curLoop&&!B) music(wantLoop); } },{capture:true});
document.addEventListener('visibilitychange',()=>{ if(!AC) return; if(document.hidden) AC.suspend(); else AC.resume(); });

/* ====== Tischeffekte: bewegte Teilchen am Tisch, Treffer-Effekte und Umgebungsgeräusche je Spieltisch ====== */
const FXC={cv:null,g:null,w:0,h:0,dpr:1,parts:[],bursts:[],kind:'',run:false,last:0,t:0,gears:0};
function fxKind(){ return THEMES[S.theme].fx; }
function fxOn(){ return !S.fxOff&&!RM; }
function ambApply(){
  if(!FXC.cv){ FXC.cv=document.createElement('canvas'); FXC.cv.id='amb'; FXC.cv.setAttribute('aria-hidden','true'); document.body.appendChild(FXC.cv); FXC.g=FXC.cv.getContext('2d'); addEventListener('resize',fxSize); fxSize(); }
  const k=fxKind(); if(k!==FXC.kind){ FXC.kind=k; FXC.parts=[]; }
  FXC.cv.style.display=fxOn()?'block':'none'; fxSize();
  if(fxOn()&&!FXC.run){ FXC.run=true; FXC.last=performance.now(); requestAnimationFrame(fxLoop); }
  ambSound();
}
function fxSize(){ const c=FXC.cv, hd=document.querySelector('header'), top=hd&&$('#battle').hidden?Math.round(hd.getBoundingClientRect().bottom):0; c.style.top=top+'px'; c.style.height=`calc(100% - ${top}px)`; FXC.dpr=Math.min(2,devicePixelRatio||1); FXC.w=innerWidth; FXC.h=innerHeight-top; c.width=FXC.w*FXC.dpr; c.height=FXC.h*FXC.dpr; FXC.g.setTransform(FXC.dpr,0,0,FXC.dpr,0,0); }
const rnd=(a,b)=>a+Math.random()*(b-a);
/* Ein Teilchen der Umgebung je Tisch. x/y in Pixeln, v Geschwindigkeit, l Lebenszeit in s. */
function spawnAmb(k,init){
  const W=FXC.w,H=FXC.h,p={t:0};
  if(k==='basis') Object.assign(p,{x:rnd(0,W),y:rnd(0,H),vx:rnd(-6,6),vy:rnd(-8,-2),r:rnd(.8,2),l:rnd(6,12),c:'255,226,170',a:rnd(.25,.6)});
  else if(k==='schmiede') Object.assign(p,{x:rnd(0,W),y:init?rnd(0,H):H+5,vx:rnd(-10,10),vy:rnd(-70,-30),r:rnd(1,2.4),l:rnd(3,7),c:Math.random()<.5?'255,170,60':'255,110,30',a:rnd(.5,.95),sway:rnd(0,6)});
  else if(k==='tiefsee') Object.assign(p,{x:rnd(0,W),y:init?rnd(0,H):H+10,vx:0,vy:rnd(-40,-15),r:rnd(1.5,5),l:rnd(8,16),c:'150,230,240',a:rnd(.25,.55),sway:rnd(0,6),ring:1});
  else if(k==='totenwald') Math.random()<.45?Object.assign(p,{x:rnd(-100,W),y:rnd(H*.72,H+20),vx:rnd(6,16),vy:0,r:rnd(60,140),l:rnd(10,18),c:'170,190,160',a:rnd(.05,.1),fog:1}):Object.assign(p,{x:rnd(0,W),y:rnd(H*.2,H),vx:rnd(-8,8),vy:rnd(-6,6),r:rnd(1.5,3),l:rnd(5,10),c:Math.random()<.5?'160,255,90':'190,120,255',a:rnd(.4,.8),glow:1,sway:rnd(0,6)});
  else if(k==='kristall') Object.assign(p,{x:rnd(0,W),y:rnd(0,H),vx:rnd(-3,3),vy:rnd(-4,2),r:rnd(1,2.6),l:rnd(2,5),c:Math.random()<.5?'255,250,230':'190,240,255',a:rnd(.5,1),star:1});
  else if(k==='wolken') Object.assign(p,{x:init?rnd(-200,W):-220,y:rnd(0,H),vx:rnd(12,28),vy:rnd(-1,1),r:rnd(80,180),l:rnd(14,26),c:'255,255,255',a:rnd(.04,.08),fog:1});
  else if(k==='werkstatt') Object.assign(p,{x:Math.random()<.5?rnd(-20,W*.25):rnd(W*.75,W+20),y:H+30,vx:rnd(-6,6),vy:rnd(-35,-15),r:rnd(20,45),l:rnd(4,8),c:'215,205,190',a:rnd(.05,.11),fog:1,grow:1});
  return p;
}
const AMB_N={basis:28,schmiede:34,tiefsee:26,totenwald:24,kristall:30,wolken:9,werkstatt:12};
function burstAt(el,str){
  if(!fxOn()||!el||skip) return; const r=el.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2, k=FXC.kind, n=Math.round((k==='totenwald'||k==='werkstatt'?9:16)*(str||1));
  for(let i=0;i<n;i++){ const a=rnd(0,Math.PI*2), sp=rnd(60,220)*(str||1), p={x,y,t:0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,rot:rnd(0,6),vr:rnd(-8,8)};
    if(k==='schmiede') Object.assign(p,{l:rnd(.35,.8),r:rnd(1,2),c:'255,190,80',g:520,line:1});
    else if(k==='tiefsee') Object.assign(p,{l:rnd(.6,1.1),r:rnd(2,6),c:'170,240,250',g:-160,ring:1,vx:p.vx*.5,vy:p.vy*.5});
    else if(k==='totenwald') Object.assign(p,{l:rnd(.7,1.2),r:rnd(8,18),c:'170,110,240',g:-40,smoke:1,vx:p.vx*.3,vy:p.vy*.3});
    else if(k==='kristall') Object.assign(p,{l:rnd(.5,.9),r:rnd(3,6),c:Math.random()<.5?'235,250,255':'150,225,245',g:420,shard:1});
    else if(k==='wolken') Object.assign(p,{l:rnd(.3,.6),r:rnd(14,34),c:'255,255,255',g:0,streak:1,vx:rnd(250,420)*(Math.random()<.5?-1:1),vy:rnd(-20,20)});
    else if(k==='werkstatt') Object.assign(p,{l:rnd(.6,1),r:rnd(3,6),c:Math.random()<.6?'205,160,80':'150,140,130',g:600,gear:Math.random()<.5});
    else Object.assign(p,{l:rnd(.4,.8),r:rnd(1.5,3),c:'235,215,170',g:120,vx:p.vx*.6,vy:p.vy*.6});
    FXC.bursts.push(p); }
}
function gearPath(g,x,y,R,teeth,rot){ g.beginPath(); for(let i=0;i<teeth*2;i++){ const a=rot+i*Math.PI/teeth, r=i%2?R*.78:R; g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); g.lineTo(x+Math.cos(a+Math.PI/teeth)*r,y+Math.sin(a+Math.PI/teeth)*r); } g.closePath(); }
function fxLoop(now){
  if(!fxOn()){ FXC.run=false; FXC.g.clearRect(0,0,FXC.w,FXC.h); return; }
  const dt=Math.min(.05,(now-FXC.last)/1000); FXC.last=now; FXC.t+=dt; requestAnimationFrame(fxLoop);
  if(document.hidden) return;
  const g=FXC.g, k=FXC.kind, W=FXC.w, H=FXC.h, inB=!$('#battle').hidden, want=Math.round(AMB_N[k]*(inB?1:.55));
  g.clearRect(0,0,W,H); g.globalAlpha=inB?1:.55;
  while(FXC.parts.length<want) FXC.parts.push(spawnAmb(k,FXC.parts.length<want-2&&FXC.t<1));
  if(FXC.parts.length>want) FXC.parts.length=want;
  if(k==='tiefsee'){ for(let i=0;i<3;i++){ const x=W*(.2+.3*i)+Math.sin(FXC.t*.2+i*2)*W*.08, gr=g.createLinearGradient(x,0,x+W*.12,H*.75); gr.addColorStop(0,'rgba(140,230,240,.10)'); gr.addColorStop(1,'rgba(140,230,240,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(x-W*.04,0); g.lineTo(x+W*.06,0); g.lineTo(x+W*.22,H*.75); g.lineTo(x+W*.02,H*.75); g.fill(); } }
  if(k==='werkstatt'){ FXC.gears+=dt*.35; g.save(); g.globalAlpha=.22; g.fillStyle='#b8893f'; [[-10,H*.3,58,12,1],[-6,H*.3+92,38,9,-1.55],[W+10,H*.62,64,13,-1],[W+4,H*.62-100,34,8,1.9]].forEach(([x,y,R,t,dir])=>{ gearPath(g,x,y,R,t,FXC.gears*dir); g.fill(); }); g.globalAlpha=.5; g.fillStyle='#2a1810'; [[-10,H*.3,16],[-6,H*.3+92,10],[W+10,H*.62,18],[W+4,H*.62-100,9]].forEach(([x,y,r])=>{ g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }); g.restore(); }
  FXC.parts.forEach((p,i)=>{
    p.t+=dt; if(p.t>p.l||p.y<-200||p.x>W+260){ FXC.parts[i]=spawnAmb(k,false); return; }
    p.x+=(p.vx+(p.sway?Math.sin(FXC.t*1.5+p.sway)*12:0))*dt; p.y+=p.vy*dt; if(p.grow) p.r+=dt*8;
    const life=p.t/p.l, fade=Math.min(1,p.t*1.5)*Math.min(1,(1-life)*3), a=p.a*fade*(p.star?(.5+.5*Math.sin(FXC.t*6+p.sway*3+i)):1);
    if(a<=.003) return;
    if(p.fog){ const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r); gr.addColorStop(0,`rgba(${p.c},${a})`); gr.addColorStop(1,`rgba(${p.c},0)`); g.fillStyle=gr; g.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2); }
    else if(p.ring){ g.strokeStyle=`rgba(${p.c},${a})`; g.lineWidth=1; g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.stroke(); g.fillStyle=`rgba(255,255,255,${a*.6})`; g.fillRect(p.x-p.r*.4,p.y-p.r*.5,1.2,1.2); }
    else if(p.star){ g.strokeStyle=`rgba(${p.c},${a})`; g.lineWidth=1; const r=p.r*2.2; g.beginPath(); g.moveTo(p.x-r,p.y); g.lineTo(p.x+r,p.y); g.moveTo(p.x,p.y-r); g.lineTo(p.x,p.y+r); g.stroke(); g.fillStyle=`rgba(${p.c},${a})`; g.beginPath(); g.arc(p.x,p.y,p.r*.6,0,7); g.fill(); }
    else { if(p.glow||k==='schmiede'){ g.fillStyle=`rgba(${p.c},${a*.25})`; g.beginPath(); g.arc(p.x,p.y,p.r*3.5,0,7); g.fill(); } g.fillStyle=`rgba(${p.c},${a})`; g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.fill(); }
  });
  FXC.bursts=FXC.bursts.filter(p=>{
    p.t+=dt; if(p.t>p.l) return false; p.vy+=(p.g||0)*dt; p.vx*=1-dt*2; p.vy*=1-dt*1.2; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt;
    const a=1-p.t/p.l;
    if(p.line){ g.strokeStyle=`rgba(${p.c},${a})`; g.lineWidth=p.r; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(p.x-p.vx*.04,p.y-p.vy*.04); g.stroke(); }
    else if(p.ring){ g.strokeStyle=`rgba(${p.c},${a*.9})`; g.lineWidth=1.2; g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.stroke(); }
    else if(p.smoke){ const r=p.r*(1+p.t*2), gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r); gr.addColorStop(0,`rgba(${p.c},${a*.45})`); gr.addColorStop(1,`rgba(${p.c},0)`); g.fillStyle=gr; g.fillRect(p.x-r,p.y-r,r*2,r*2); }
    else if(p.shard){ g.save(); g.translate(p.x,p.y); g.rotate(p.rot); g.fillStyle=`rgba(${p.c},${a})`; g.beginPath(); g.moveTo(0,-p.r*1.6); g.lineTo(p.r*.6,0); g.lineTo(0,p.r*1.6); g.lineTo(-p.r*.6,0); g.fill(); g.restore(); }
    else if(p.streak){ const gr=g.createLinearGradient(p.x-p.r,p.y,p.x+p.r,p.y); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,`rgba(${p.c},${a*.7})`); gr.addColorStop(1,'rgba(255,255,255,0)'); g.strokeStyle=gr; g.lineWidth=1.5; g.beginPath(); g.moveTo(p.x-p.r,p.y); g.lineTo(p.x+p.r,p.y); g.stroke(); }
    else if(p.gear){ g.fillStyle=`rgba(${p.c},${a})`; gearPath(g,p.x,p.y,p.r,7,p.rot); g.fill(); }
    else { g.fillStyle=`rgba(${p.c},${a})`; g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.fill(); }
    return true;
  });
}
/* Umgebungsgeräusche, alle im Spiel erzeugt. Laufen über den Regler „Umgebung“. */
const AMB={kind:'',nodes:[],next:{},timer:0,noise:null,brown:null};
function ambBufs(){
  if(AMB.noise) return; const n=AC.sampleRate*2;
  AMB.noise=AC.createBuffer(1,n,AC.sampleRate); const d=AMB.noise.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  AMB.brown=AC.createBuffer(1,n,AC.sampleRate); const b=AMB.brown.getChannelData(0); let l=0; for(let i=0;i<n;i++){ l=(l+.02*(Math.random()*2-1))/1.02; b[i]=l*3.5; }
}
function ambLoop(buf,type,freq,q,gain){ const s=AC.createBufferSource(); s.buffer=buf; s.loop=true; s.loopStart=Math.random(); const f=AC.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q||.7; const g=AC.createGain(); g.gain.value=gain; s.connect(f); f.connect(g); g.connect(aOut); s.start(); AMB.nodes.push(s); return {s,f,g}; }
function ambBurst(type,freq,q,gain,dur,when){ const t=AC.currentTime+(when||0), s=AC.createBufferSource(); s.buffer=AMB.noise; const f=AC.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q; const g=AC.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+Math.min(.01,dur/4)); g.gain.exponentialRampToValueAtTime(.0001,t+dur); s.connect(f); f.connect(g); g.connect(aOut); s.start(t,Math.random()); s.stop(t+dur+.05); }
function ambTone(f0,f1,type,gain,dur,when,dest){ const t=AC.currentTime+(when||0), o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur*.6); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(dest||aOut); o.start(t); o.stop(t+dur+.05); }
function creak(gain){ const t=AC.currentTime, o=AC.createOscillator(), f=AC.createBiquadFilter(), g=AC.createGain(), d=rnd(.5,1.1); o.type='sawtooth'; o.frequency.setValueAtTime(rnd(55,80),t); o.frequency.linearRampToValueAtTime(rnd(90,130),t+d); f.type='bandpass'; f.frequency.value=rnd(600,900); f.Q.value=6; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+.08); g.gain.linearRampToValueAtTime(gain*.6,t+d*.7); g.gain.linearRampToValueAtTime(0,t+d); o.connect(f); f.connect(g); g.connect(aOut); o.start(t); o.stop(t+d+.05); }
function anvil(){ [1,2.76,5.4,8.93].forEach((m,i)=>ambTone(510*m,0,'sine',.09/(i+1),1.6/(1+i*.4))); ambBurst('highpass',3000,.7,.12,.05); }
const AMB_EV={
  basis:{crack:[.08,.45,()=>ambBurst('bandpass',rnd(1800,4500),1.5,rnd(.04,.2),rnd(.01,.03))],pop:[3,9,()=>{ for(let i=0;i<3;i++) ambBurst('bandpass',rnd(1500,3000),2,rnd(.1,.25),.02,i*rnd(.03,.08)); }]},
  schmiede:{crack:[.06,.3,()=>ambBurst('bandpass',rnd(2000,5000),1.5,rnd(.05,.2),rnd(.01,.025))],anvil:[6,13,()=>{ anvil(); if(Math.random()<.6) setTimeout(()=>AC&&anvil(),rnd(450,650)); }]},
  tiefsee:{bub:[.3,2.2,()=>{ const n=Math.random()<.3?4:1; for(let i=0;i<n;i++) ambTone(rnd(250,450),rnd(900,1500),'sine',.05,.09,i*rnd(.05,.12)); }]},
  totenwald:{wind:[1.5,3,()=>{ const w=AMB.wind; if(w){ const t=AC.currentTime; w.f.frequency.setTargetAtTime(rnd(250,800),t,1.2); w.g.gain.setTargetAtTime(rnd(.05,.16),t,1.5); } }],creak:[5,11,()=>creak(.05)]},
  kristall:{drop:[.25,1.1,()=>ambBurst('highpass',rnd(1200,2500),.8,rnd(.02,.05),rnd(.04,.09))],chime:[2.5,6,()=>{ const f=[1318,1568,1760,2093,2637][Math.floor(Math.random()*5)]; ambTone(f,0,'sine',.035,2.6); ambTone(f*2.01,0,'sine',.012,1.4); }]},
  wolken:{wind:[1.2,2.5,()=>{ const w=AMB.wind; if(w){ const t=AC.currentTime; w.f.frequency.setTargetAtTime(rnd(300,1000),t,1); w.g.gain.setTargetAtTime(rnd(.08,.22),t,1.2); } }],creak:[4,9,()=>creak(.045)],prop:[14,24,()=>{ const t=AC.currentTime, o=AC.createOscillator(), f=AC.createBiquadFilter(), g=AC.createGain(); o.type='sawtooth'; o.frequency.value=rnd(20,26); f.type='lowpass'; f.frequency.value=220; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.14,t+3); g.gain.linearRampToValueAtTime(0,t+6.5); o.connect(f); f.connect(g); g.connect(aOut); o.start(t); o.stop(t+6.6); }]},
  werkstatt:{tick:[.5,.5,()=>{ AMB.tk=!AMB.tk; ambTone(AMB.tk?2600:1900,0,'square',.025,.018); }],hiss:[5,10,()=>ambBurst('highpass',rnd(2500,4500),.7,rnd(.05,.1),rnd(.8,1.6))],clank:[8,16,()=>{ ambTone(rnd(700,1100),0,'triangle',.05,.25); ambTone(rnd(1500,2200),0,'sine',.03,.4,.04); }]}
};
function ambSound(){
  if(!AC||!aOut) return; const k=fxKind(); if(k===AMB.kind) return; AMB.kind=k; ambBufs();
  AMB.nodes.forEach(n=>{ try{ n.stop(); }catch(e){} }); AMB.nodes=[]; AMB.wind=null; AMB.next={};
  if(k==='basis') ambLoop(AMB.brown,'lowpass',300,.7,.06);
  if(k==='schmiede') ambLoop(AMB.brown,'lowpass',200,.7,.1);
  if(k==='tiefsee') ambLoop(AMB.brown,'lowpass',130,.7,.35);
  if(k==='totenwald') AMB.wind=ambLoop(AMB.noise,'bandpass',500,1.2,.1);
  if(k==='kristall') ambLoop(AMB.noise,'bandpass',900,.6,.012);
  if(k==='wolken') AMB.wind=ambLoop(AMB.noise,'bandpass',600,1,.14);
  if(k==='werkstatt') ambLoop(AMB.brown,'lowpass',160,.7,.06);
  if(!AMB.timer) AMB.timer=setInterval(ambTick,90);
}
function ambTick(){
  if(!AC||AC.state!=='running'||S.muted||S.vol.a<=0) return; const ev=AMB_EV[AMB.kind]; if(!ev) return; const now=AC.currentTime;
  for(const n in ev){ const [lo,hi,fn]=ev[n]; if(AMB.next[n]==null) AMB.next[n]=now+rnd(lo,hi); if(now>=AMB.next[n]){ AMB.next[n]=now+rnd(lo,hi); try{ fn(); }catch(e){} } }
}
function ambStart(){ AMB.kind=''; ambSound(); }


let SQ=null;
function playSeq(key,then){
  const q=SEQ[key]; if(!q||SQ) return; SQ={key,q,i:-1,then,lay:0,t:0}; closeSheet();
  const el=$('#seq'); el.hidden=false;
  el.innerHTML=`<div class="sq-img"></div><div class="sq-img"></div><div class="sq-txt"><p class="eyebrow">${q.t}</p><p class="sq-t"></p><span class="sq-dots">${q.slides.map(()=>'<i></i>').join('')}</span></div><button class="sq-skip" data-act="seqSkip">Überspringen</button>`;
  if(q.music) music(q.music,true);
  seqNext();
}
/* ====== Sprache in den Zwischensequenzen: ein Clip pro Folie im Ordner ton/, die Musik wird darunter leiser ====== */
const VX={buf:{},src:null,tok:0,guard:0};
/* Clipname für Folie n (ab 1). Wer Kartenbinderin gewählt hat, bekommt die passende Fassung, falls es eine gibt. */
function voxName(key,n){ const b=key+'-'+n; return S.sex==='w'&&VOX.has(b+'-w')?b+'-w':VOX.has(b)?b:null; }
function voxLoad(n){
  return VX.buf[n]||(VX.buf[n]=fetch('ton/'+n+'.mp3').then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(b=>new Promise((ok,no)=>AC.decodeAudioData(b,ok,no))).catch(e=>{ delete VX.buf[n]; throw e; }));
}
function voxDuck(on){ if(!mDuck) return; const t=AC.currentTime; mDuck.gain.cancelScheduledValues(t); mDuck.gain.setTargetAtTime(on?.3:1,t,on?.15:.6); }
function voxStop(){ VX.tok++; clearTimeout(VX.guard); const s=VX.src; VX.src=null; if(s){ try{ s.onended=null; s.stop(); }catch(e){} } }
/* Spielt einen Clip. done(true) wenn er zu Ende ist, done(false) wenn es keinen Ton gibt (aus, stumm, fehlt, lädt zu lange). */
function voxPlay(n,delay,done){
  voxStop(); const tok=VX.tok;
  if(!n||!AC||S.muted||!(S.vol.v>0)) return done(false);
  if(AC.state==='suspended') AC.resume();
  let late=false; const fb=setTimeout(()=>{ late=true; if(tok===VX.tok) done(false); },2500);
  voxLoad(n).then(buf=>{
    if(late||tok!==VX.tok) return; clearTimeout(fb);
    const src=AC.createBufferSource(); src.buffer=buf; src.connect(vOut); VX.src=src; voxDuck(true);
    const fin=()=>{ if(tok!==VX.tok) return; clearTimeout(VX.guard); VX.src=null; done(true); };
    src.onended=fin; src.start(AC.currentTime+delay);
    VX.guard=setTimeout(fin,(buf.duration+delay)*1000+4000);
  }).catch(()=>{ if(late||tok!==VX.tok) return; clearTimeout(fb); done(false); });
}
function seqNext(){
  if(!SQ) return; clearTimeout(SQ.t); SQ.i++;
  if(SQ.i>=SQ.q.slides.length) return seqEnd();
  const [img,txt]=SQ.q.slides[SQ.i], L=document.querySelectorAll('#seq .sq-img'), a=L[SQ.lay], b=L[1-SQ.lay];
  a.style.backgroundImage=`url(bilder/${img}.jpg)`; a.classList.remove('on'); void a.offsetWidth; a.classList.add('on'); b.classList.remove('on'); SQ.lay=1-SQ.lay;
  const t=$('#seq .sq-t'); t.classList.remove('on'); t.innerHTML=esc(kb(txt)).replace(/\n/g,'<br>'); void t.offsetWidth; t.classList.add('on');
  document.querySelectorAll('#seq .sq-dots i').forEach((d,k)=>d.classList.toggle('on',k<=SQ.i));
  const nx=SQ.q.slides[SQ.i+1]; if(nx){ const pre=new Image(); pre.src=`bilder/${nx[0]}.jpg`; const nv=AC&&voxName(SQ.key,SQ.i+2); if(nv) voxLoad(nv).catch(()=>{}); }
  /* Mit Ton: weiter, sobald der Clip zu Ende ist (mindestens 4 s pro Folie). Ohne Ton: nach Lesezeit. */
  const sq=SQ, t0=Date.now(), read=Math.max(5500,txt.length*85), first=SQ.i===0&&SQ.q.music;
  voxPlay(voxName(SQ.key,SQ.i+1),first?2:.35,ok=>{ if(SQ!==sq) return;
    if(!ok) voxDuck(false);
    SQ.t=setTimeout(seqNext,ok?Math.max(1200,4000-(Date.now()-t0)):Math.max(0,read-(Date.now()-t0))); });
}
function seqEnd(){ const q=SQ; if(!q) return; clearTimeout(q.t); voxStop(); voxDuck(false); SQ=null; const el=$('#seq'); el.hidden=true; el.innerHTML=''; S.seen[q.key]=1; persist(); if(q.q.music) music(tabMusic()); if(q.then) q.then(); }
/* Prüft nach jedem Neuzeichnen der Kampagne, ob eine Sequenz fällig ist. */
function storyCheck(){
  if(menuOn||SQ||B||tab!=='map'||!$('#sheet').hidden) return;
  if(!S.seen.intro) return playSeq('intro',()=>{ render(); if(!S.stars[1]) startStage(1,false); });
  const fa=AREAS.findIndex((A,a)=>A.end&&S.stars[BOSS_ID(a)]&&!S.seen[A.end]); if(fa>=0) return playSeq(AREAS[fa].end,()=>storyReward(AREAS[fa].end));
  const bt=BEATS.find(([id,k])=>S.stars[id]&&!S.seen[k]); if(bt) return playSeq(bt[1],()=>storyReward(bt[1]));
  if(mapArea!=null&&!S.seen['a'+mapArea]) return playSeq('a'+mapArea,()=>render());
}
/* Ganze Geschichte eines Gebiets nacheinander ansehen: Anfang, erreichte Story-Momente, beim ersten Gebiet der Prolog, beim letzten das Finale. */
function areaStory(a){
  const k=(a===0?['intro']:[]).concat('a'+a, BEATS.filter(([id])=>STAGES[id-1].area===a&&S.stars[id]).map(b=>b[1]));
  if(AREAS[a].end&&S.stars[BOSS_ID(a)]) k.push(AREAS[a].end); return k;
}
/* Belohnungen aus der Geschichte: Karte (falls noch nicht da) und festes Sondermotiv. Nur beim ersten Ansehen. */
function storyReward(key){
  const got=[];
  (STORY_REW[key]||[]).forEach(([id,v])=>{ const neu=!S.cards[id];
    if(neu){ S.cards[id]={lvl:1,star:1,dup:0}; if(!S.unlocked.includes(id)) S.unlocked.push(id); }
    if(v&&!ownSkins(id).includes(v)){ S.skins[id]=ownSkins(id).concat(v).sort(); S.skinOn[id]=v; (S.skinNew=S.skinNew||{})[id]=1; }
    else if(!neu) return;
    got.push([id,v]); });
  persist(); render(); if(!got.length) return;
  sfx('rare2');
  openSheet(`<p class="eyebrow">Aus der Geschichte</p><h2>${got.some(g=>g[1])?'Neues Sondermotiv':'Neue Karte'}</h2><div class="grid g3">${got.map(([id,v])=>{ const o=S.cards[id];
    return `<button class="loot-i" data-act="artOpen" data-id="${id}">${cardHTML({id,lvl:o.lvl,star:o.star,skin:v||undefined})}<span class="lt ${v?'sp':'neu'}">${v?'✦ '+(SKINS[id]>1?skinName(id,v):'Sondermotiv'):'Neue Karte'}</span></button>`; }).join('')}</div>
  <div class="row-btns"><button class="btn primary" data-act="close">Weiter</button></div>`);
}
function playChain(keys){ const k=keys.shift(); if(!k){ render(); return; } playSeq(k,()=>playChain(keys)); }

/* ====== Bild groß ansehen: Standard und gefundene Sondermotive, wischen zum Wechseln ====== */
let AV=null;
function artView(id){
  const vs=[0].concat(ownSkins(id)); AV={id,vs,i:Math.max(0,vs.indexOf(skinOn(id)))}; const el=$('#art'); el.hidden=false; artDraw();
}
function artDraw(){
  const {id,vs,i}=AV, d=CARD[id], v=vs[i], el=$('#art');
  el.innerHTML=`<div class="art-img" style="background-image:url(${skinSrc(id,v)})"></div><div class="art-txt"><p class="eyebrow">${CATS[d.cat]} · Set ${SETS[d.set].n} · ${RAR[d.r]}${vs.length>1?` · ${v?'✦ '+(SKINS[id]>1?skinName(id,v):'Sondermotiv'):'Standard'}`:''}</p><h2>${d.n}</h2><p>„${LORE[id]}“</p></div>
  ${vs.length>1?`<button class="art-nav l" data-act="artPrev" aria-label="Voriges Motiv">‹</button><button class="art-nav r" data-act="artNext" aria-label="Nächstes Motiv">›</button><span class="art-dots">${vs.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</span>`:''}<button class="art-x" data-act="artClose" aria-label="Schließen">✕</button>`;
}
function artStep(n){ if(!AV||AV.vs.length<2) return; AV.i=(AV.i+n+AV.vs.length)%AV.vs.length; artDraw(); }
function artClose(){ AV=null; const el=$('#art'); el.hidden=true; el.innerHTML=''; }
(()=>{ let x0=null; document.addEventListener('pointerdown',e=>{ if(AV&&e.target.closest('#art')) x0=e.clientX; });
  document.addEventListener('pointerup',e=>{ if(!AV||x0==null) return; const dx=e.clientX-x0; x0=null; if(Math.abs(dx)>40){ artStep(dx<0?1:-1); e.preventDefault(); } else if(!e.target.closest('.art-nav,.art-x')) artClose(); }); })();

/* ====== Herausforderungen: jede Woche drei Regeln, je drei Kämpfe ====== */
const RULES=[
 {id:'bronze',n:'Nur Bronze',d:'Nur Bronzekarten sind erlaubt.',ok:c=>c.r===0},
 {id:'elem',n:p=>'Nur '+CATS[p],d:p=>`Nur ${CATS[p]}-Karten sind erlaubt.`,param:'cat',ok:(c,o,p)=>c.cat===p},
 {id:'vier',n:'Kleines Deck',d:'Höchstens 4 Karten im Deck.',max:4},
 {id:'keindia',n:'Ohne Diamant',d:'Diamantkarten sind nicht erlaubt.',ok:c=>c.r<3},
 {id:'zweisets',n:'Zwei Sets',d:'Karten aus höchstens zwei Sets.',sets:2},
 {id:'vorteil',n:'Gegen den Strom',d:'Die Gegner haben Elementvorteil gegen dein Deck.',enemy:'advantage'},
 {id:'ohneheld',n:'Ohne Held',d:'Dein Held hat nur 1 Leben: Eine leere Bahn bedeutet die Niederlage.',noHero:1},
 {id:'schild',n:'Schildwall',d:'Alle gegnerischen Karten haben Schild.',eShield:1},
 {id:'zerfall',n:'Zerfall',d:'Zu Beginn jeder Runde verlieren alle Karten 5 % ihres Lebens.',decay:.05},
 {id:'jung',n:'Frische Kräfte',d:'Nur Karten unter Level 10.',ok:(c,o)=>o.lvl<10},
 {id:'freiset',n:p=>'Invasion: '+SETS[p].n,d:p=>`Der Gegner spielt das ganze Set ${SETS[p].n}.`,param:'set',enemy:'freeset'},
 {id:'spiegel',n:'Spiegelkampf',d:'Der Gegner hat genau dein Deck.',enemy:'mirror'}];
const RULE=Object.fromEntries(RULES.map(r=>[r.id,r]));
function weekNo(){ return Math.floor((Date.now()/864e5+3)/7); }
function weekRules(){
  const wk=weekNo(), r=rng(wk*7919+13), pool=shuffle(RULES.slice(),r).slice(0,3), free=Object.keys(SETS).filter(x=>SETS[x].free);
  return pool.map(x=>({rid:x.id,p:x.param==='cat'?Object.keys(CATS)[Math.floor(r()*5)]:x.param==='set'?free[Math.floor(r()*free.length)]:null}));
}
function chState(){ const wk=weekNo(); if(S.ch.wk!==wk) S.ch={wk,prog:{},all:0}; return S.ch; }
function txt(v,p){ return typeof v==='function'?v(p):v; }
function chAllowed(w,id){ const R=RULE[w.rid], c=CARD[id], o=S.cards[id]; return !!o&&(!R.ok||R.ok(c,o,w.p)); }
function chMax(w){ return RULE[w.rid].max||DECK_MAX; }
function chDeck(w){ const k=w.rid+(w.p||''); return (S.chDecks[k]=(S.chDecks[k]||[]).filter(id=>chAllowed(w,id)).slice(0,chMax(w))); }
function chValid(w){ const d=chDeck(w), R=RULE[w.rid]; return d.length>=DECK_MIN&&(!R.sets||new Set(d.map(id=>CARD[id].set)).size<=R.sets); }
function chObjs(w){ return chDeck(w).map(id=>({id,lvl:S.cards[id].lvl,star:S.cards[id].star,skin:skinOn(id)})); }
/* Gegner: Stärke nach Kartenbinder-Level, jeder der drei Kämpfe etwas härter. */
function chEnemy(w,k,pd){
  const R=RULE[w.rid], q=Math.min(1,S.plvl/40+k*.07), seed=weekNo()*101+RULES.indexOf(R)*17+k, base=botDeck(seed,q), lvl=Math.round(base.reduce((x,c)=>x+c.lvl,0)/base.length);
  const mk=ids=>ids.map(id=>({id,lvl,star:Math.min(MAXSTAR,Math.ceil(lvl/5))}));
  if(R.enemy==='mirror') return pd.map(d=>Object.assign({},d,{skin:0}));
  if(R.enemy==='freeset') return mk(BASE.filter(c=>c.set===w.p).map(c=>c.id));
  if(R.enemy==='advantage'){ const cnt={}; pd.forEach(d=>{ const c=CARD[d.id].cat; cnt[c]=(cnt[c]||0)+1; }); const main=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0], beat=Object.keys(STRONG).filter(c=>STRONG[c]===main);
    const r=rng(seed), pool=shuffle(BASE.filter(c=>beat.includes(c.cat)&&c.r<=Math.max(...base.map(b=>CARD[b.id].r))),r); return mk(pool.slice(0,base.length).map(c=>c.id)); }
  return base;
}
function startChallenge(i){
  const w=weekRules()[i], ch=chState(), k=ch.prog[w.rid]||0; if(k>=3) return; if(!chValid(w)){ sheetChDeck(i); return; }
  const R=RULE[w.rid], pd=chObjs(w);
  startBattle({mode:'heraus',ci:i,w,k,pDeck:pd,eDeck:chEnemy(w,k,pd),rule:R,title:`${txt(R.n,w.p)} · Kampf ${k+1} von 3`,opp:'Herausforderung'});
}
function sheetChDeck(i){
  const w=weekRules()[i], R=RULE[w.rid], d=chDeck(w), ids=Object.keys(S.cards).filter(id=>chAllowed(w,id)).sort((a,b)=>power(b)-power(a));
  openSheet(`<p class="eyebrow">Herausforderung</p><div class="sec-h"><h2>${txt(R.n,w.p)}</h2><span class="count">${d.length}/${chMax(w)} Karten</span></div><p class="muted">${txt(R.d,w.p)} Tippe Karten an, um sie ins Deck zu nehmen. Mindestens ${DECK_MIN}.</p>
  ${ids.length?`<div class="grid g5">${ids.map(id=>`<button class="tile chpick${d.includes(id)?' on':''}" data-act="chPick" data-id="${i}:${id}">${cardHTML({id,lvl:S.cards[id].lvl,star:S.cards[id].star})}${d.includes(id)?'<span class="flag">✓</span>':''}</button>`).join('')}</div>`:'<p class="muted">Du hast noch keine passenden Karten.</p>'}
  <div class="row-btns"><button class="btn" data-act="close">Fertig</button><button class="btn primary" data-act="chGo" data-id="${i}" ${chValid(w)?'':'disabled'}>Kampf beginnen</button></div>`);
}
function viewChallenges(){
  if(!S.stars[BOSS_ID(0)]) return `<section class="panelbox"><h2>Herausforderungen</h2><p class="muted">Besiege den Endgegner des Aschenpfads, dann warten hier jede Woche drei Herausforderungen mit eigenen Deckregeln.</p></section>`;
  const ch=chState(), ws=weekRules(), done=ws.filter(w=>(ch.prog[w.rid]||0)>=3).length, left=7-Math.floor((Date.now()/864e5+3)%7);
  let h=`<section class="panelbox"><p class="eyebrow">Diese Woche · noch ${left} ${left===1?'Tag':'Tage'}</p><h2>Herausforderungen</h2><p class="muted">Jede besteht aus 3 Kämpfen, die immer schwerer werden. Für jede eigene Regeln und ein eigenes Deck. Belohnung: je eine Silbertruhe, für alle drei zusätzlich eine Goldtruhe.</p><div class="prog"><div class="bar"><i style="width:${Math.round(done/3*100)}%"></i></div><span>${done} von 3 geschafft${ch.all?' · Goldtruhe abgeholt':''}</span></div></section>`;
  ws.forEach((w,i)=>{ const R=RULE[w.rid], k=ch.prog[w.rid]||0, d=chDeck(w), ok=chValid(w);
    h+=`<section class="chal${k>=3?' fertig':''}"><div class="sec-h"><h3>${txt(R.n,w.p)}</h3><span class="pips3">${[0,1,2].map(x=>`<i class="${x<k?'on':''}"></i>`).join('')}</span></div><p class="muted">${txt(R.d,w.p)}</p>
    ${k>=3?'<p class="r-line">✓ Geschafft · Silbertruhe erhalten</p>':`<div class="row-btns"><button class="btn" data-act="chDeck" data-id="${i}">Deck (${d.length}/${chMax(w)})</button><button class="btn primary" data-act="chGo" data-id="${i}" ${ok?'':'disabled'}>Kampf ${k+1} von 3</button></div>`}</section>`; });
  return h;
}
let arenaTab='duelle';

/* ====== Bausteine ====== */
function kwLine(k){ return Object.entries(k).map(([x,v])=>KW[x].n+(KWP[x]?' '+v*KWP[x]+' %':'')).join(' · '); }
function kwLong(k){ return Object.entries(k).map(([x,v])=>`<b>${KW[x].n}${KWP[x]?' '+v*KWP[x]+' %':''}:</b> ${KW[x].d(v)}`); }
function skinOn(id){ const v=S.skinOn[id]|0; return ownSkins(id).includes(v)?v:0; }
function cardHTML(c,cls){
  const d=CARD[c.id], lvl=c.lvl||1, star=c.star||1, st=stats(c.id,lvl,star), a=c.a??st.a, h=c.h??st.h, mh=c.mh??st.h, k=c.k||kwOf(c.id,star), kw=kwLine(k), sk=c.skin??skinOn(c.id), src=skinSrc(c.id,sk);
  return `<span class="card r${d.r}${sk?' sp':''} ${cls||''}" style="--art:url(${src});--ec:${CCOL[d.cat][1]}"><span class="frm"></span><img class="elc" src="bilder/items/${d.cat}-1.png" alt="" title="${CATS[d.cat]}">${sk?'<span class="glint"></span>':''}<span class="setb" style="--fc:${SCOL(d.set)}" title="Set ${SETS[d.set].n}">${SETS[d.set].l}</span><span class="lvl">${lvl}</span><span class="plate"><span class="stc">${'★'.repeat(star)}</span><b class="nm">${d.n}</b>${kw?`<span class="kw">${kw}</span>`:''}</span><span class="atk${a>st.a?' up':''}">${a}</span><span class="rarl">${RAR[d.r]}</span><span class="hp${h<mh?' hurt':''}">${Math.max(0,h)}</span></span>`;
}
function itemIcon(cat,q,size){ const z=Math.round((size||22)*1.25); return `<img class="itm" src="bilder/items/${cat}-${q}.png" width="${z}" height="${z}" alt="">`; }
function skipIcon(z){ z=Math.round(z*1.25); return `<img class="itm" src="bilder/items/rolle.png" width="${z}" height="${z}" alt="">`; }
function itemsLine(list){ return list.map(x=>`<span class="ichip">${itemIcon(x.cat,x.q,18)}+${x.n} ${itemName(x.cat,x.q)}</span>`).join(''); }
function starsHTML(n,cls){ return `<span class="stars ${cls||''}" role="img" aria-label="${n} von 3 Sternen">${[1,2,3].map(i=>`<i class="st${i<=n?' on':''}"></i>`).join('')}</span>`; }
/* Helden-Porträts: eigener Held (Laden, 30 Glutsteine) und feste Porträts der Rivalen. */
const HEROES={sammler:'Kartenbinder',sammlerin:'Kartenbinderin',kapuze:'Der Namenlose',ormak:'Schlackenfürst Ormak',ysra:'Gezeitenmutter Ysra',urborke:'Urborke',hohlerkoenig:'Der Hohle König',aurel:'Erzseraphin Aurel',feuermagierin:'Feuermagierin',zwerg:'Zwergenkrieger',elfe:'Waldläuferin',soeldner:'Söldner',meerhexe:'Meerhexe',gelehrter:'Gelehrter',vampirgraefin:'Vampirgräfin',ritter:'Junger Ritter',nomadin:'Nomadin',pirat:'Piratenkapitän',erfinderin:'Erfinderin',leuchtturm:'Leuchtturmwärterin',fliegerass:'Fliegerass',zirkusdirektor:'Zirkusdirektor',nekromant:'Nekromant'};
function kb(t){ return String(t).replace(/\{KB\}/g,S.sex==='w'?'Kartenbinderin':'Kartenbinder'); }
const HERO_PRICE=30, HERO_KEYS=Object.keys(HEROES);
function heroImg(k,cls){ return `<img class="pt${cls?' '+cls:''}" src="bilder/helden/${k}.png" alt="" aria-hidden="true">`; }
const FREE_HEROES=['sammler','sammlerin','kapuze'], RIVAL_HEROES=HERO_KEYS.slice(8);
function rivalHero(r){ return RIVAL_HEROES[(r.s>>>0)%RIVAL_HEROES.length]; }
function rivalBySeed(n){ return S.table.rivals.find(x=>x.n===n); }
/* Gesicht des Gegners im Dialog: beim Endgegner sein Porträt, sonst das stärkste Gegnerbild im Deck. */
function foeAv(st){ if(st.boss){ const b=BASE.find(c=>c.set===st.set&&c.r===3); return heroImg(b.id); }
  const d=stageDeck(st), top=d.map(x=>CARD[x.id]).sort((a,b)=>b.r-a.r)[0]; return `<img class="pt foeav" src="bilder/${top.id}.jpg" alt="" aria-hidden="true">`; }
function avHTML(n,hue){ return `<span class="av" style="--h:${hue??hash(n)%360}" aria-hidden="true">${esc(n[0].toUpperCase())}</span>`; }
function deckInfo(d){ return d.length+' Karten · Ø Level '+Math.round(d.reduce((a,c)=>a+(c.lvl||1),0)/d.length); }
function isOpen(st){ return st.id===1||S.stars[st.id-1]>0; }
function areaDone(a){ return !!S.stars[BOSS_ID(a)]; }
function elLine(cat){ return `Stark gegen ${CATS[STRONG[cat]]}, schwach gegen ${CATS[WEAKTO[cat]]}.`; }
function knownSets(){ return Object.keys(SETS).filter(x=>BASE.some(c=>c.set===x&&S.cards[c.id])); }
function setChip(x,on,act){ return `<button class="setchip${on?' on':''}" style="--fc:${SCOL(x)}" ${act?`data-act="${act}" data-id="${x}" aria-pressed="${on}"`:''}><i>${SETS[x].l}</i>${SETS[x].n}</button>`; }
function bonusHTML(ids){
  const cnt=setCounts(ids);
  return `<ul class="gloss">${Object.keys(SETS).filter(x=>cnt[x]).map(x=>{ const n=cnt[x], lv=n>=6?2:n>=3?1:0;
    return `<li><span class="setchip${lv?' on':''}" style="--fc:${SCOL(x)}"><i>${SETS[x].l}</i>${n}/6</span> ${lv?`<b>${SET_BONUS[x][0]}${lv>=2?', '+SET_BONUS[x][1]:''}</b>`:`<span class="muted">ab 3: ${SET_BONUS[x][0]}</span>`}</li>`; }).join('')}</ul>`;
}
/* Karten ohne Kreatur in der Truhe: Gegenstand, Gold, Rolle, Glutsteine. Rahmen nach Wert. */
function lootRar(x){ return x.t==='punkte'?x.tier+1:x.t==='kreatur'?CARD[x.id].r:x.t==='gegenstand'?x.q:x.t==='steine'?3:x.t==='rolle'?2:x.t==='gold'?1:0; }
function lootImg(x){ return x.t==='punkte'?medal(x.tier):x.t==='gegenstand'?`bilder/items/${x.cat}-${x.q}.png`:x.t==='gold'?'bilder/muenze.png':x.t==='rolle'?'bilder/items/rolle.png':'bilder/glutstein.png'; }
function lootTitle(x){ return x.t==='punkte'?EV_TN[x.tier]+'punkte':x.t==='gegenstand'?itemName(x.cat,x.q):x.t==='gold'?'Gold':x.t==='rolle'?'Schnellsieg-Rolle':'Glutsteine'; }
function lootLabel(x){ return x.t==='punkte'?`+${x.n} ${EV_TN[x.tier]}punkte`:x.t==='gegenstand'?`+${x.n} ${itemName(x.cat,x.q)}`:x.t==='gold'?`+${x.n} Gold`:x.t==='rolle'?'+1 Rolle':`+${x.n} Glutsteine`; }
function lootText(x){ return x.t==='punkte'?'Eventpunkte für die nächste, bessere Eventtruhe.':x.t==='gegenstand'?`Zum Leveln von ${CATS[x.cat]}-Karten der Seltenheit ${RAR[x.q]}.`:x.t==='gold'?'Für Truhen, Leveln und Verbessern.':x.t==='rolle'?'Gewinnt ein Gefecht sofort, das du schon mit drei Sternen geschafft hast.':'Ein seltener Fund! Glutsteine gibt es für Aussehen im Laden.'; }
function lootCardHTML(x){ return `<span class="card lootc r${lootRar(x)}"><span class="frm"></span><img class="lootimg" src="${lootImg(x)}" alt=""><span class="plate"><b class="nm">${lootTitle(x)}</b></span><span class="lootn">${x.t==='rolle'?'×1':x.t==='gold'?x.n:'×'+x.n}</span></span>`; }
function kindLabel(x){
  if(x.kind==='neu') return 'Neue Karte'; if(x.kind==='gold') return `+${x.gold} Gold (Karte ausgereizt)`;
  const o=S.cards[x.id], u=STAR_UP[o.star+1]; return u?`Doppelt · ${o.dup} von ${u.d} für ${'★'.repeat(o.star+1)}`:'Doppelt';
}
let toastT=0;
function toast(msg){ if(/mindestens|nicht leer|nicht genug|zu wenig|gesperrt|fehlt/i.test(msg)) sfx('need'); const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2800); }
function openSheet(html,modal){ const s=$('#sheet'); s.innerHTML=`<div class="scrim"${modal?'':' data-act="close"'}></div><div class="panel" role="dialog" aria-modal="true">${html}</div>`; s.hidden=false; s.dataset.modal=modal?'1':''; }
function closeSheet(){ const s=$('#sheet'); s.hidden=true; s.innerHTML=''; s.dataset.modal=''; setTimeout(flushAch,50); }

/* ====== Ansichten ====== */
function render(){
  checkSeason();
  $('#gold').textContent=fmt(S.gold); $('#gems').textContent=S.gems;
  const pl=$('#plvl'); if(pl){ pl.innerHTML=`<b>${S.plvl}</b><span class="pbar"><i style="width:${S.plvl>=PMAX?100:Math.round(S.xp/xpNeed(S.plvl)*100)}%"></i></span>`; pl.title=`Kartenbinder-Level ${S.plvl}${S.plvl<PMAX?` · ${S.xp}/${xpNeed(S.plvl)} Erfahrung`:''}`; }
  const sn=$('#snd'); sn.classList.toggle('on',!S.muted);
  sn.innerHTML=`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/>${!S.muted?'<path d="M16.5 8.5a5 5 0 0 1 0 7"/>':'<path d="M17 9l5 6M22 9l-5 6"/>'}</svg>`;
  document.querySelectorAll('#tabs button').forEach(b=>{
    if(b.dataset.tab===tab) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    const dot=(b.dataset.tab==='event'&&evDot())||(b.dataset.tab==='shop'&&(achOpen()||S.chests.length))||(b.dataset.tab==='album'&&albumOpen()); b.querySelector('.dot')?.remove(); if(dot) b.insertAdjacentHTML('beforeend','<i class="dot" aria-label="neu"></i>');
  });
  $('#view').className=tab==='map'||tab==='event'?'mapmode':''; $('#view').innerHTML=({map:viewMap,event:viewEvent,deck:viewDeck,album:viewAlbum,arena:viewArena,shop:viewShop})[tab]();
  setTimeout(storyCheck,0); setTimeout(saveReminder,50);
  if(S.seasonMsg&&$('#sheet').hidden){ const m=S.seasonMsg; S.seasonMsg=null; persist(); openSheet(`<p class="eyebrow">Saison beendet</p><h2>Belohnung für die ${LEAGUES[m.best].n}</h2><p class="r-line"><span class="gem"></span>+${m.gems} Glutsteine</p><p class="r-line"><span class="coin"></span>+${m.gold} Gold</p><p class="muted">Deine Pokale wurden für die neue Saison um 30 % gesenkt.</p><button class="btn primary" data-act="close">Weiter</button>`); }
}
function tasksHTML(){
  const d=daily(), done=dailyDone();
  return `<section class="panelbox"><div class="sec-h"><p class="eyebrow">Tagesaufgaben</p><span class="count">${d.claimed?'erledigt':'Belohnung: Silbertruhe'}</span></div>
  <ul class="tasks">${d.tasks.map(t=>`<li class="task${t.p>=t.g?' done':''}"><div class="tl"><b>${t.t}</b><span>${t.p}/${t.g}</span></div><div class="bar"><i style="width:${Math.round(t.p/t.g*100)}%"></i></div></li>`).join('')}</ul>
  ${d.claimed?'<p class="muted">Morgen gibt es neue Aufgaben.</p>':`<button class="btn${done?' primary':''} block" data-act="claim" ${done?'':'disabled'}>${done?'Silbertruhe öffnen':'Erledige alle drei für eine Silbertruhe'}</button>`}</section>`;
}
function stageReward(st){ return ''; }
/* ====== Kampagne als Landkarte ======
   Jedes Gebiet hat eine eigene Karte. Gezeigt wird nur, was schon erkundet ist; Wechsel zwischen Gebieten erst, wenn eines durchgespielt ist. */
/* Wege auf den Landkarten (Prozent der Kartenbreite/-höhe), nachgezeichnet entlang der gemalten Straße. MAP_ST: welche Wegpunkte die 8 Stationen sind. */
const MAP_PATH=[
 [[12,86],[16,83],[21,79],[25,74],[30,71],[37,71],[44,71],[50,70],[54,66],[58,63],[63,62],[68,62],[73,61],[79,57],[84,52],[87,47],[85,42],[80,38],[75,34],[73,29],[78,23],[83,19],[85,13]],
 [[13,86],[19,80],[24,73],[28,68],[36,68],[45,71],[54,71],[62,68],[70,65],[77,61],[78,56],[72,53],[64,54],[56,53],[46,50],[40,49],[34,46],[31,41],[36,39],[44,38],[50,35],[53,29],[58,24],[66,22],[74,20],[82,17],[87,14]],
 [[12,86],[17,84],[23,80],[28,74],[34,71],[42,70],[50,71],[56,68],[59,63],[60,58],[66,56],[73,54],[80,50],[84,46],[78,42],[70,39],[68,34],[75,31],[80,26],[83,20],[85,14]],
 [[12,80],[17,80],[23,75],[30,71],[38,67],[43,62],[41,56],[38,51],[40,46],[46,43],[50,37],[56,31],[64,30],[72,27],[78,21],[84,16],[87,12]],
 [[11,85],[17,82],[22,77],[28,71],[32,65],[31,58],[30,51],[33,45],[39,43],[46,41],[52,37],[58,34],[64,31],[70,27],[76,22],[81,17],[85,12]],
 [[40.5,85.8],[44,85],[52,84],[60,83],[67,81],[73,77],[79,74],[83,70],[84,65],[83,59],[78,56],[72,54],[64,53],[57,52],[49,51],[43,49],[40,45],[41,41],[44,39],[51,37],[60,37],[69,36],[77,35],[82,33],[84,30],[83,27.5],[79,26.5],[75,25],[71.5,23],[69,21],[68.5,19],[71,18.2],[75,17.6],[80,16.5],[86,15],[90,14.2]]];
const MAP_ST=[[0,3,6,10,14,17,19,23],[0,3,6,9,13,17,22,26],[0,3,6,9,12,15,17,20],[0,2,4,7,9,11,13,16],[0,3,5,7,9,11,13,16],[0,4,8,12,18,24,30,37]];
/* 16 Stationen gleichmäßig entlang des Wegs verteilen (Karte ist 3:2, deshalb x-Abstände breiter gewichtet). */
function walk(P){ const L=[0]; for(let i=1;i<P.length;i++) L.push(L[i-1]+Math.hypot((P[i][0]-P[i-1][0])*1.5,P[i][1]-P[i-1][1])); return L; }
function atLen(P,L,d){ let i=1; while(i<P.length-1&&L[i]<d) i++; const t=Math.max(0,Math.min(1,(d-L[i-1])/(L[i]-L[i-1]||1))); return [+(P[i-1][0]+(P[i][0]-P[i-1][0])*t).toFixed(1),+(P[i-1][1]+(P[i][1]-P[i-1][1])*t).toFixed(1),i]; }
const MAP_PTS=MAP_PATH.map(P=>{ const L=walk(P), T=L[L.length-1]; return Array.from({length:STAGES_PER},(_,k)=>atLen(P,L,T*k/(STAGES_PER-1))); });
function pathTo(a,k){ const P=MAP_PATH[a], q=MAP_PTS[a][k]; return P.slice(0,q[2]).concat([[q[0],q[1]]]); }
/* Weich geschwungene Linie durch die Wegpunkte (Catmull-Rom als Bézier). */
function smoothPath(P){ if(P.length<2) return ''; let d=`M${P[0][0]},${P[0][1]}`; for(let i=0;i<P.length-1;i++){ const p0=P[i-1]||P[i], p1=P[i], p2=P[i+1], p3=P[i+2]||p2; d+=` C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)},${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)},${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0]},${p2[1]}`; } return d; }
let mapArea=null, lastCur=null;
function curArea(){ const nx=STAGES.find(s=>!S.stars[s.id]); return nx?nx.area:AREAS.length-1; }
function areaKnown(a){ return a>=0&&a<=curArea(); }
function viewMap(){
  const cur=curArea(); if(mapArea==null||!areaKnown(mapArea)||cur!==lastCur){ mapArea=cur; lastCur=cur; }
  const a=mapArea, A=AREAS[a], list=STAGES.filter(s=>s.area===a), P=MAP_PTS[a], done=areaDone(a), next=list.find(s=>!S.stars[s.id]);
  const total=Object.values(S.stars).reduce((x,y)=>x+y,0), W=MAP_PATH[a];
  const reach=list.filter(isOpen).length;
  let h=`<div class="mapwrap"><div class="mapbox" style="--map:url(bilder/karte-${a+1}.jpg)"><svg class="mpath" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="pl-all" d="${smoothPath(W)}"/>${reach>1?`<path class="pl-done" d="${smoothPath(pathTo(a,reach-1))}"/>`:''}</svg>`;
  list.forEach((st,k)=>{ const got=S.stars[st.id]||0, hg=S.hstars[st.id]||0, open=isOpen(st), cls=got?'done':open?'open':'locked';
    h+=`<button class="mnode ${cls}${st.boss?' boss':''}${hg?' hero':''}" style="left:${P[k][0]}%;top:${P[k][1]}%" data-act="stage" data-id="${st.id}" ${open?'':'disabled'} aria-label="${open?st.n+(hg?', heroisch geschafft':''):'Noch unbekannt'}"><span class="mn"><b>${open?k+1:'?'}</b>${hg?'<i class="crown">♛</i>':''}</span>${got?`<span class="mst">${starsHTML(got,'mini')}${hg?starsHTML(hg,'mini hs'):''}</span>`:''}${cls==='open'?`<span class="mtag">${st.n}</span>`:''}</button>`; });
  h+=`<div class="mtitle"><p class="eyebrow">${A.ep||'Gebiet '+ROM[a+1]}</p><h2>${A.n.split(' · ')[1]}</h2></div>`;
  if(a>0) h+=`<button class="marrow l" data-act="mapGo" data-id="${a-1}" aria-label="Voriges Gebiet">‹ ${AREAS[a-1].n.split(' · ')[1]}</button>`;
  if(done&&a<AREAS.length-1) h+=`<button class="marrow r" data-act="mapGo" data-id="${a+1}" aria-label="Nächstes Gebiet">${AREAS[a+1].n.split(' · ')[1]} ›</button>`;
  h+=`</div><aside class="mside"><section class="panelbox">`;
  h+= next?`<p class="eyebrow">Nächstes Gefecht</p><h3>${next.i+1} · ${next.n}</h3><p class="muted">${next.size} ${SETS[next.set].n}-Karten auf Level ${next.lvl}, Held mit ${next.hp} Leben.</p><button class="btn primary block" data-act="fight" data-id="${next.id}">Kämpfen</button>`
          : `<p class="eyebrow">Gebiet geschafft</p><h3>${A.fin||A.n.split(' · ')[1]}</h3><p class="muted">Hol dir fehlende Sterne oder versuch dich an den heroischen Gefechten.</p>`;
  h+=`<button class="link" data-act="replayStory" data-id="${a}">Geschichte ansehen</button><div class="facts"><div><b>${total}/${STAGES.length*3}</b><span>Sterne</span></div><div><b>${BASE.filter(c=>S.cards[c.id]).length}</b><span>Karten</span></div><div><b>${Object.keys(S.hstars).length}</b><span>heroisch</span></div></div></section>${tasksHTML()}</aside></div>`;
  return h;
}
function tile(id,inRow){
  const o=S.cards[id];
  if(!o) return `<div class="tile"><span class="back" aria-label="Noch nicht gefunden"></span><span class="q" aria-hidden="true">?</span></div>`;
  const flag=S.skinNew&&S.skinNew[id]?'<span class="flag sk">✦ Neues Sondermotiv</span>':canUp(id)?'<span class="flag up">aufwertbar</span>':!inRow&&deck().includes(id)?'<span class="flag">im Deck</span>':'';
  return `<button class="tile" data-act="card" data-id="${id}" aria-label="${CARD[id].n}">${cardHTML({id,lvl:o.lvl,star:o.star})}${flag}</button>`;
}
function itemsPanel(){
  return `<section class="panelbox"><div class="sec-h"><h2>Gegenstände</h2><span class="count">zum Leveln</span></div>
  <p class="muted">Jede Karte levelt mit Gegenständen ihres Elements in ihrer Qualität: Bronze mit Splittern, Silber mit Kristallen, Gold mit Kernen, Diamant mit Herzen.</p>
  <p class="r-line" style="justify-content:flex-start">${skipIcon(22)} ${S.skips} Schnellsieg-Rollen</p><div class="itable"><span></span>${ITEM_Q.map(q=>`<b>${q[0].toUpperCase()+q.slice(1)}</b>`).join('')}${Object.keys(CATS).map(c=>`<b>${CATS[c]}</b>${[0,1,2,3].map(q=>`<span title="${itemName(c,q)}">${itemIcon(c,q,20)}${S.items[c][q]}</span>`).join('')}`).join('')}</div></section>`;
}
function filterHTML(){
  return `<p class="flabel">Kategorie</p><div class="chips"><button class="chip" data-act="fcat" data-id="alle" aria-pressed="${fCat==='alle'}">Alle</button>${Object.keys(CATS).map(c=>`<button class="chip" data-act="fcat" data-id="${c}" aria-pressed="${fCat===c}" style="--fc:${CCOL[c][1]}"><i></i>${CATS[c]}</button>`).join('')}</div>
  <p class="flabel">Set</p><div class="setrow"><button class="chip" data-act="fset" data-id="alle" aria-pressed="${fSet==='alle'}">Alle</button>${knownSets().map(x=>setChip(x,fSet===x,'fset')).join('')}</div>`;
}
/* Stärke zum Sortieren: Angriff + Leben + Wert der freigeschalteten Fähigkeiten. Tanks stehen so genauso weit vorne wie Angreifer. */
const KW_VAL={flug:110,durchbruch:50,einschlag:45,schild:70,heilung:45,segen:60,wut:50,rache:35,anfuehrer:60};
function power(id){ const o=S.cards[id], st=stats(id,o.lvl,o.star), k=kwOf(id,o.star); return st.a+st.h+Object.entries(k).reduce((x,[kk,v])=>x+KW_VAL[kk]*(KW[kk].v?v:1),0)*mult(o.star,o.lvl,CARD[id].r); }
function viewDeck(){
  const dk=deck().slice().sort((a,b)=>power(b)-power(a));
  let h=`<section><div class="chips">${[0,1,2].map(i=>`<button class="chip" data-act="deckSlot" data-id="${i}" aria-pressed="${S.di===i}">Deck ${i+1}</button>`).join('')}</div>
  <div class="sec-h"><h2>Deck ${S.di+1}</h2><span class="count">${dk.length}/${DECK_MAX} Karten</span></div>
  <p class="muted">${DECK_MIN} bis ${DECK_MAX} Karten, jede nur einmal. Drei starten auf dem Feld, der Rest liegt gemischt im Ziehstapel. Tippe eine Karte an, um sie zu leveln oder zu verbessern.</p><div class="grid g4">`;
  for(let i=0;i<DECK_MAX;i++) h+= dk[i] ? tile(dk[i],true) : `<div class="empty-slot">frei</div>`;
  h+=`</div>${dk.length?`<p class="flabel">Setbonus</p>${bonusHTML(dk)}`:''}</section>
  <section><div class="sec-h"><h2>Sammlung</h2><span class="count">${BASE.filter(c=>S.cards[c.id]).length}/${BASE.length} Karten · stärkste zuerst</span></div>${filterHTML()}
  <div class="grid g3">${BASE.filter(c=>S.cards[c.id]&&(fCat==='alle'||c.cat===fCat)&&(fSet==='alle'||c.set===fSet)).sort((a,b)=>power(b.id)-power(a.id)).map(c=>tile(c.id)).join('')||'<p class="muted">Keine Karten in diesem Filter.</p>'}</div></section>${itemsPanel()}`;
  return h;
}
let albumOpenSets=null;
function viewAlbum(){
  if(!albumOpenSets) albumOpenSets=new Set(knownSets().filter(x=>allOf(x)&&!S.album[x]));
  let h=`<section><h2>Sammelbuch</h2><p class="muted">Jedes vollständige Set bringt einmalig ${ALBUM_REWARD.gems} Glutsteine und ${ALBUM_REWARD.gold} Gold. Tippe ein Set an, um es auf- oder zuzuklappen.</p></section>`;
  knownSets().forEach(x=>{
    const cards=BASE.filter(c=>c.set===x), have=cards.filter(c=>S.cards[c.id]).length, sk=cards.reduce((n,c)=>n+ownSkins(c.id).length,0), skT=cards.reduce((n,c)=>n+(SKINS[c.id]||0),0), full=have===cards.length, open=albumOpenSets.has(x), claim=full&&!S.album[x];
    h+=`<section class="panelbox${full?' setdone':''}"><button class="album-h fold" data-act="albumFold" data-id="${x}" aria-expanded="${open}"><span class="setchip${full?' on':''}" style="--fc:${SCOL(x)}"><i>${SETS[x].l}</i>${SETS[x].n}</span><span class="count">${setSrc(x)?`<b class="srcic" title="Häufiger in ${SRC_N[setSrc(x)]}-Truhen">${SRC_ICON[setSrc(x)]} ${SRC_N[setSrc(x)]}</b> · `:''}${setCats(x)} · ${have}/${cards.length} Karten · ${sk}/${skT} Sondermotive</span>${full?'<span class="done-ck" aria-label="komplett">✓</span>':''}${cards.some(c=>S.skinNew&&S.skinNew[c.id])?'<i class="dot sk" aria-label="Neues Sondermotiv"></i>':''}${claim?'<i class="dot" aria-label="Belohnung"></i>':''}<span class="chev" aria-hidden="true">${open?'▴':'▾'}</span></button>
    <div class="bar"><i style="width:${Math.round(have/cards.length*100)}%;background:${SCOL(x)}"></i></div>
    ${open?`<div class="grid g3">${cards.map(c=>tile(c.id)).join('')}</div>
    <p class="muted"><b>Setbonus</b> ab 3 Karten im Deck: ${SET_BONUS[x][0]}. Mit allen 6: ${SET_BONUS[x][1]}.</p>
    ${full?(S.album[x]?'<p class="muted">Belohnung abgeholt.</p>':`<button class="btn primary block" data-act="albumClaim" data-id="${x}">Belohnung abholen</button>`):''}`:''}</section>`;
  });
  return h;
}
function viewArena(){
  const sub=`<div class="subnav"><button data-act="arenaTab" data-id="duelle" aria-pressed="${arenaTab==='duelle'}">Duelle</button><button data-act="arenaTab" data-id="heraus" aria-pressed="${arenaTab==='heraus'}">Herausforderungen</button></div>`;
  if(arenaTab==='heraus') return sub+viewChallenges();
  return sub+viewDuels();
}
function viewDuels(){
  const lg=S.table.lg, L=LEAGUES[lg], nx=LEAGUES[lg+1], near=byDist(), best=near[0], opps=near.slice(0,3).sort((a,b)=>b.t-a.t);
  const all=S.table.rivals.map(r=>({n:r.n,t:r.t})).concat([{n:S.name,t:S.tr,me:1}]).sort((a,b)=>b.t-a.t||(a.me?-1:1)), rank=all.findIndex(r=>r.me)+1, left=WIN_CHEST_EVERY-S.aw%WIN_CHEST_EVERY, sb=Math.max(S.seasonBest,lg);
  let h=`<section class="panelbox arenahead"><img class="crest" src="bilder/liga-${lg}.png" alt="${L.n}"><p class="eyebrow">${L.n} · Saison endet in ${seasonDaysLeft()} Tagen</p><div class="sec-h"><h1>${esc(S.name)}</h1><button class="link" data-act="rename">Name ändern</button></div>
  <div class="facts"><div><b>${S.tr}</b><span>Pokale</span></div><div><b>${rank}.</b><span>Platz von ${all.length}</span></div><div><b>${S.aw}</b><span>Siege</span></div></div>
  ${nx?`<div class="prog"><div class="bar"><i style="width:${Math.round((S.tr-L.lo)/(nx.lo-L.lo)*100)}%"></i></div><span>Noch ${nx.lo-S.tr} Pokale bis zur ${nx.n}</span></div>`:'<p class="muted">Du spielst in der höchsten Liga.</p>'}
  <div class="prog"><span class="pips3" aria-hidden="true">${Array.from({length:WIN_CHEST_EVERY},(_,i)=>`<i class="${i<S.aw%WIN_CHEST_EVERY?'on':''}"></i>`).join('')}</span><span>Bronzetruhe nach ${left===1?'dem nächsten Sieg':left+' weiteren Siegen'}</span></div>
  <p class="muted">Saisonbelohnung bisher: ${5+5*sb} Glutsteine und ${100*(sb+1)} Gold.</p>
  <button class="btn primary block" data-act="duel" data-id="${best.s}">Duell gegen ${best.n}</button></section>`;
  h+=`<section><div><h2>Gegner wählen</h2><p class="muted">Tippe einen Rivalen an, um sein Deck zu sehen.</p></div><ul class="rivals">${opps.map(r=>`<li><button data-act="rival" data-id="${r.s}">${heroImg(rivalHero(r))}<span class="nn"><b>${r.n}</b><small>Level ${rivalLvl(r)} · ${r.t} Pokale · ${deckInfo(rivalDeck(r))}</small></span><span class="delta"><b>+${trophyDelta(S.tr,r.t,true)}</b>${trophyDelta(S.tr,r.t,false)} bei Niederlage</span></button></li>`).join('')}</ul></section>`;
  h+=`<section><div class="sec-h"><h2>Liga-Tabelle</h2><span class="count">${L.n}</span></div><ol class="table">${all.map((r,i)=>`<li class="${r.me?'me':''}"><span class="rk">${i+1}</span>${r.me?heroImg(S.hero):heroImg(rivalHero(rivalBySeed(r.n)||{s:0}))}<span>${esc(r.n)}</span><span>${r.t}</span></li>`).join('')}</ol></section>`;
  return h;
}
function viewShop(){
  const ao=achOpen(), tabs=[['truhen','Truhen'],['tische','Tische'],['ruecken','Kartenrücken'],['helden','Helden'],['erfolge','Erfolge'],['steine','Glutsteine']], co=S.chests.length;
  let h=`<div class="subnav">${tabs.map(([k,n])=>`<button data-act="shopTab" data-id="${k}" aria-pressed="${shopTab===k}">${n}${(k==='erfolge'&&ao)||(k==='truhen'&&co)?'<i class="dot" aria-label="neu"></i>':''}</button>`).join('')}</div>`;
  if(shopTab==='truhen') h+=`${S.chests.length?`<section class="panelbox"><div class="sec-h"><p class="eyebrow">Deine Truhen · gratis</p><span class="count">${S.chests.length}</span></div>
  <div class="chests">${S.chests.map((x,i)=>`<div class="ch ${x.type}"><img src="bilder/truhe-${x.type}.png" alt=""><b>${x.src?SRC_N[x.src]+'-':''}${CHESTS[x.type].n}</b><button class="btn primary" data-act="openOwned" data-id="${i}">Gratis öffnen</button></div>`).join('')}</div></section>`:''}
  <section class="panelbox"><p class="eyebrow">Truhen kaufen · nur für Gold</p>
  <div class="chests">${Object.entries(CHESTS).map(([k,c])=>`<div class="ch ${k}"><img src="bilder/truhe-${k}.png" alt=""><b>${c.n}</b><button class="btn${S.gold>=c.price?' primary':''}" data-act="buyChest" data-id="${k}" ${S.gold>=c.price?'':'disabled'}><span class="coin"></span>${fmt(c.price)}</button></div>`).join('')}</div>
  <p class="muted">Bronze 3 Karten, Silber 4, Gold 5. Jede Karte ist eine Kreatur, ein Gegenstand oder Gold, mindestens eine ist immer eine Kreatur. Bessere Truhen bringen bessere Gegenstände und mehr Gold.</p></section>
  <section><h2>Offene Quoten</h2><p class="muted">Seltenheit der Kreaturen auf deinem Kartenbinder-Level ${S.plvl}. Mit jedem Level steigt die Chance auf bessere Karten.</p>
  <table class="odds"><thead><tr><th>Seltenheit</th>${Object.values(CHESTS).map(c=>`<th>${c.n.replace('truhe','')}</th>`).join('')}</tr></thead><tbody>${RAR.map((n,i)=>`<tr><td>${n} <span class="muted">(${RAR_DESC[i]})</span></td>${Object.keys(CHESTS).map(k=>`<td>${chestOdds(k)[i]} %</td>`).join('')}</tr>`).join('')}</tbody></table>
  <ul class="kv"><li><span>Eine Karte ist Kreatur / Gegenstand / Gold</span><b>${SLOT_W.kreatur} / ${SLOT_W.gegenstand} / ${SLOT_W.gold} %</b></li><li><span>Schnellsieg-Rolle (Bronze / Silber / Gold)</span><b>${Object.values(SKIP_CHANCE).map(v=>Math.round(v*100)).join(' / ')} %</b></li><li><span>Glutsteine in der Goldtruhe</span><b>${Math.round(GEM_CHANCE*100)} %</b></li></ul>
  <ul class="kv"><li><span>Sondermotiv zur Karte</span><b>${Math.round(SKIN_CHANCE*100)} %</b></li><li><span>Noch gesperrte Karte</span><b>${Math.round(LOCKED_CHANCE*100)} %</b></li>${[1,2,3,4,5].map(l=>`<li><span>Karte schon mit ${'★'.repeat(l)}</span><b>${Math.round(STAR_WEIGHT[l]*100)} % Ziehchance</b></li>`).join('')}</ul>
  <p class="muted">Freigeschaltet sind deine Startkarten, Karten aus der Kampagne und nach jedem Endgegner das ganze Set seines Gebiets. Karten der freien Sets kommen, sobald ihr Element in der Kampagne erreicht ist: Feuer nach den ersten drei Gefechten, die anderen nach dem Endgegner ihres Gebiets. Je mehr Sterne eine Karte schon hat, desto seltener kommt sie als Doppelte.</p></section>`;
  else if(shopTab==='tische') h+=`<section><div class="sec-h"><h2>Spieltische</h2><span class="count">${S.themes.length}/${Object.keys(THEMES).length} im Besitz</span></div><p class="muted">Spieltische ändern nur Aussehen und Klang. Weitere Farben haben die Effekte des Grundtischs, Thementische eigene Effekte, Treffer und Geräusche.</p><div class="swatches">${Object.entries(THEMES).map(([id,t])=>{ const own=S.themes.includes(id), act=S.theme===id;
    return `<button class="sw${act?' act':''}" data-act="theme" data-id="${id}" style="--c1:${t.c[0]};--c2:${t.c[1]};--c3:${t.c[2]};${t.img?`--pic:url(${t.img})`:''}"><i></i><b>${t.n}</b><small class="tfx">${TFX[t.fx].d}</small><span>${act?'Liegt gerade auf':own?'Auflegen':`<span class="gem"></span>${t.p} Glutsteine`}</span></button>`; }).join('')}</div></section>`;
  else if(shopTab==='helden') h+=`<section><div class="sec-h"><h2>Helden</h2><span class="count">${S.heroes.length}/${HERO_KEYS.length} im Besitz</span></div><p class="muted">Dein Held zeigt sich im Kampf, in der Arena und in den Gesprächen. Reines Aussehen.</p><div class="backs">${HERO_KEYS.map(k=>{ const own=S.heroes.includes(k), act=S.hero===k;
    return `<button class="bk hk${act?' act':''}" data-act="heroPick" data-id="${k}">${heroImg(k)}<b>${HEROES[k]}</b><span>${act?'In Benutzung':own?'Benutzen':`<span class="gem"></span>${HERO_PRICE} Glutsteine`}</span></button>`; }).join('')}</div></section>`;
  else if(shopTab==='ruecken') h+=`<section><div class="sec-h"><h2>Kartenrücken</h2><span class="count">${S.backs.length}/${Object.keys(BACKS).length} im Besitz</span></div><p class="muted">Kartenrücken ändern nur das Aussehen: Ziehstapel, Truhen und Sammelbuch.</p><div class="backs">${Object.entries(BACKS).map(([k,b])=>{ const own=S.backs.includes(k), act=S.back===k;
    return `<button class="bk${act?' act':''}${b.earn&&!own?' earn':''}" data-act="back" data-id="${k}"><img src="${backSrc(k)}" alt=""><b>${b.n}</b><span>${act?'In Benutzung':own?'Benutzen':b.earn?'🏆 '+b.earn:`<span class="gem"></span>${b.p} Glutsteine`}</span></button>`; }).join('')}</div></section>`;
  else if(shopTab==='erfolge'){ const done=ACH.filter(a=>S.ach[a.id]).length;
    h+=`<section class="panelbox"><div class="sec-h"><h2>Erfolge</h2><span class="count">${done}/${ACH.length}${ao?` · ${ao} abholbereit`:''}</span></div>
    <ul>${ACH.slice().sort((a,b)=>((S.ach[b.id]===1)-(S.ach[a.id]===1))||((!!S.ach[a.id])-(!!S.ach[b.id]))).map(a=>{ const st=S.ach[a.id];
      return `<li class="ach${st===2?' claimed':''}"><b>${a.t}</b>${st===1?`<button class="btn primary" data-act="achClaim" data-id="${a.id}"><span class="gem"></span>${a.g}</button>`:`<span class="g"><span class="gem"></span>${st===2?'abgeholt':a.g}</span>`}<small>${a.d}</small></li>`; }).join('')}</ul></section>`; }
  else h+=`<section class="panelbox"><p class="eyebrow">Vorschau · im Prototyp ausgeschaltet</p><h2>Glutsteine kaufen</h2><p class="muted">Hier dockt später der Echtgeld-Laden an. Glutsteine kaufen nur Aussehen. Truhen, Karten und Sondermotive gibt es nie für Echtgeld. Die Preise sind Platzhalter.</p>
  <ul class="kv iap">${IAP.map(p=>`<li><span><span class="gem"></span>${p.gems} Glutsteine</span><button class="btn" data-act="iap" data-id="${p.id}">${p.price}</button></li>`).join('')}</ul></section>
  <section><h2>So kommst du an Gold und Glutsteine</h2><ul class="kv"><li><span>Gefecht in der Kampagne</span><b>Gold und Gegenstände</b></li><li><span>Endgegner</span><b>Goldtruhe + ${GEM_BOSS} Glutsteine</b></li><li><span>Sieg in der Arena</span><b>20–40 Gold</b></li><li><span>Jeder ${WIN_CHEST_EVERY}. Arena-Sieg</span><b>Holztruhe</b></li><li><span>Tagesaufgaben</span><b>Silbertruhe</b></li><li><span>Liga-Aufstieg</span><b>Goldtruhe + ${GEM_PROMO} Glutsteine</b></li><li><span>Erfolge, Album, Saisonende</span><b>Glutsteine</b></li></ul></section>`;
  return h;
}
function statsHTML(){
  const strong=Object.keys(S.cards).sort((a,b)=>power(b)-power(a))[0], best=S.stat.best, days=Math.floor((Date.now()-S.lastSave)/864e5);
  return `<section><h3>Statistik</h3><ul class="kv"><li><span>Kartenbinder-Level</span><b>${S.plvl}</b></li><li><span>Kämpfe gespielt</span><b>${S.stat.fights}</b></li><li><span>Siege gesamt</span><b>${S.wins}</b></li><li><span>Arena</span><b>${S.aw} Siege · ${S.al} Niederlagen</b></li><li><span>Besiegte Karten</span><b>${S.stat.kills}</b></li><li><span>Truhen geöffnet</span><b>${S.opened}</b></li><li><span>Karten gesammelt</span><b>${Object.keys(S.cards).length} von ${BASE.length}</b></li><li><span>Sterne in der Kampagne</span><b>${Object.values(S.stars).reduce((x,y)=>x+y,0)} von ${STAGES.length*3}</b></li>${strong?`<li><span>Stärkste Karte</span><b>${CARD[strong].n}</b></li>`:''}${best?`<li><span>Seltenster Fund</span><b>${CARD[best].n} (${RAR[CARD[best].r]})</b></li>`:''}<li><span>Höchste Liga</span><b>${LEAGUES[S.league].n}</b></li><li><span>Zuletzt gesichert</span><b>${days===0?'heute':days===1?'gestern':`vor ${days} Tagen`}</b></li></ul></section>`;
}
/* Erinnerung: alle 3 Tage einmal fragen, ob der Spielstand gesichert werden soll. Safari kann Daten nach längerer Pause löschen. */
function saveReminder(){
  if(B||SQ||!$('#sheet').hidden||tab!=='map'||!S.seen.intro) return; const today=dayKey();
  if(Date.now()-S.lastSave<3*864e5||S.remind===today) return; S.remind=today; persist();
  openSheet(`<h2>Spielstand sichern?</h2><p class="muted">Dein Fortschritt liegt nur auf diesem Gerät. Safari kann gespeicherte Daten löschen, wenn du die App länger nicht öffnest. Mit einem Sicherungscode holst du alles zurück.</p><div class="row-btns"><button class="btn" data-act="close">Später</button><button class="btn primary" data-act="saveNow">Jetzt sichern</button></div>`);
}
function sheetSettings(){
  const el=c=>`<span class="el" style="--fc:${CCOL[c][1]}"><i></i>${CATS[c]}</span>`;
  openSheet(`<div class="sec-h"><h2>Einstellungen</h2><button class="btn" data-act="close">Schließen</button></div>
  <section><h3>Ton</h3>
  <label class="slider" for="volm">Musik<input type="range" id="volm" min="0" max="100" value="${Math.round(S.vol.m*100)}" data-vol="m"><span id="volm-v">${Math.round(S.vol.m*100)}</span></label>
  <label class="slider" for="vols">Effekte<input type="range" id="vols" min="0" max="100" value="${Math.round(S.vol.s*100)}" data-vol="s"><span id="vols-v">${Math.round(S.vol.s*100)}</span></label>
  <label class="slider" for="vola">Umgebung<input type="range" id="vola" min="0" max="100" value="${Math.round(S.vol.a*100)}" data-vol="a"><span id="vola-v">${Math.round(S.vol.a*100)}</span></label>
  <label class="slider" for="volv">Sprache<input type="range" id="volv" min="0" max="100" value="${Math.round(S.vol.v*100)}" data-vol="v"><span id="volv-v">${Math.round(S.vol.v*100)}</span></label></section>
  <section><h3>Tischeffekte</h3><div class="decknum"><span>Bewegte Effekte am Tisch und bei Treffern<br><small class="muted">Für ältere Handys ausschalten.</small></span><button class="btn${S.fxOff?'':' primary'}" data-act="fxToggle">${S.fxOff?'Aus':'An'}</button></div></section>
  ${statsHTML()}
  <section><h3>So wird gespielt</h3><ol class="steps">
  <li>Jede Seite hat einen Helden, drei Karten auf dem Feld und einen gemischten Ziehstapel. Die nächste Karte ist sichtbar.</li>
  <li>Zu Beginn jeder Runde wirken Fähigkeiten. Dann kämpfen Bahn 1, 2 und 3 nacheinander. Auf einer Bahn schlagen beide Karten gleichzeitig zu.</li>
  <li>Fällt eine Karte, rückt die nächste aus dem Stapel nach. Ist eine Bahn leer, trifft die Karte gegenüber den Helden.</li>
  <li>Gewonnen hat, wer dem Gegner alle Karten oder das ganze Leben nimmt. Jede eigene Karte, die am Ende noch steht, bringt einen Stern.</li>
  <li>Ab Runde ${FATIGUE_FROM} verlieren beide Helden jede Runde Leben.</li></ol>
  <button class="btn" data-act="tutReset">Tutorial im nächsten Kampf erneut zeigen</button></section>
  <section><h3>Elemente</h3><p class="muted">Mit Elementvorteil gibt es ${Math.round((STRONG_MULT-1)*100)} % mehr Schaden gegen die Karte gegenüber, aufgerundet.</p>
  <div class="wheel">${el('wasser')}<span>schlägt</span>${el('feuer')}${el('feuer')}<span>schlägt</span>${el('erde')}${el('erde')}<span>schlägt</span>${el('wasser')}${el('licht')}<span>und</span>${el('schatten')}</div></section>
  
  <section><h3>Leveln und Verbessern</h3><p class="muted">Jedes Level bringt +${LVL_PCT*100} % auf Angriff und Leben und kostet Gegenstände und Gold. Pro Stern sind 5 Level möglich. Am Ende eines Sterns verbesserst du die Karte mit Doppelten: +${STAR_PCT*100} %, und 5 weitere Level werden frei. Höchstens ${MAXSTAR} Sterne und Level ${MAXLVL}.</p><ul class="kv">${[2,3,4,5].map(x=>`<li><span>${'★'.repeat(x)} (bis Level ${x*5})</span><b>${STAR_UP[x].d} Doppelte · ${fmt(STAR_UP[x].g)} Gold</b></li>`).join('')}</ul></section>
  <section><h3>Schlüsselwörter</h3><ul class="gloss">${Object.values(KW).map(k=>`<li><b>${k.n}${k.v?' X':''}:</b> ${k.d('X')}</li>`).join('')}</ul></section>
  <section><h3>Fairness</h3><ol class="steps"><li>Kein Vorteil gegen Geld. Glutsteine kaufen nur Aussehen.</li><li>Keine Energie, keine Wartezeiten.</li><li>Truhen gibt es nie für Echtgeld, alle Quoten stehen offen im Laden.</li><li>Rivalen in der Arena sind computergesteuert.</li></ol></section>
  <section><h3>Spielstand</h3><p class="muted">Dein Spielstand liegt in diesem Browser. Mit dem Code nimmst du ihn auf ein anderes Gerät mit.</p>
  <label class="lbl" for="savecode">Spielstand-Code</label><textarea id="savecode" rows="3" spellcheck="false" autocomplete="off"></textarea>
  <div class="row-btns"><button class="btn" data-act="export">Code erzeugen</button><button class="btn" data-act="import">Code laden</button></div>
  <button class="btn" data-act="menuOpen">Zum Hauptmenü</button><p class="muted">Prototyp 0.7 · Arbeitstitel Glutstein · Gegenstandssymbole sind Platzhalter</p></section>`);
}
function sheetStage(id){
  const st=STAGES.find(s=>s.id===id), open=isOpen(st), got=S.stars[id]||0, hg=S.hstars[id]||0, hero=areaDone(st.area), d=stageDeck(st), uniq={}; d.forEach(c=>uniq[c.id]=(uniq[c.id]||0)+1);
  openSheet(`<p class="eyebrow">${AREAS[st.area].n} · Gefecht ${st.i+1}</p><div class="sec-h"><h2>${st.n}</h2>${starsHTML(got)}</div>
  <ul class="kv"><li><span>Gegner</span><b>${st.size} Karten · Level ${st.lvl} · Held ${st.hp} Leben</b></li>${hero?`<li><span>Heroisch: +8 Level, doppeltes Heldenleben</span><b>${hg?'★'.repeat(hg):'offen'}</b></li>`:''}</ul>
  <h3>Belohnung</h3><ul class="rew"><li class="ok">Jeder Sieg: ${st.gold} Gold + 1 ${itemName(st.cat,stageItem(st).q)}</li><li class="${got>=2?'ok':''}">${got>=2?'✓ ':''}Erstmals ★★: +1 ${itemName(st.cat,stageItem(st).q)}</li><li class="${got>=3?'ok':''}">${got>=3?'✓ ':''}Erstmals ★★★: +50 % Gold</li>${hero?`<li class="${hg>=3?'ok':''}">Heroisch: 2 Gegenstände, 1,5-faches Gold${hg>=3?' ✓':''}</li><li class="${S.foeSets.includes(AREAS[st.area].foe)?'ok':''}">Alle 16 Gefechte heroisch mit ★★★: das Set „${SETS[AREAS[st.area].foe].n}“</li>`:''}</ul>
  <h3>Gegnerisches Deck</h3><div class="grid g4">${Object.keys(uniq).map(c=>`<div class="tile">${cardHTML({id:c,lvl:st.lvl,star:st.star})}${uniq[c]>1?`<span class="flag">×${uniq[c]}</span>`:''}</div>`).join('')}</div>
  <div class="row-btns"><button class="btn" data-act="close">Zurück</button><button class="btn primary" data-act="fight" data-id="${id}" ${open?'':'disabled'}>${open?'Kampf beginnen':'Noch gesperrt'}</button>${hero?`<button class="btn" data-act="fightHero" data-id="${id}">Heroisch</button>`:''}</div>
  <div class="row-btns"><button class="btn" data-act="quickWin" data-id="${id}" ${got===3&&S.skips>0?'':'disabled'}>${skipIcon(18)} Schnellsieg (${S.skips})</button>${hero?`<button class="btn" data-act="quickWin" data-id="${id}h" ${hg===3&&S.skips>0?'':'disabled'}>${skipIcon(18)} Heroisch (${S.skips})</button>`:''}</div>`);
}
function sheetRival(seed){
  const r=S.table.rivals.find(x=>x.s===seed); if(!r) return; const dk=rivalDeck(r);
  openSheet(`<p class="eyebrow">${LEAGUES[S.table.lg].n}</p><div class="rivalhead">${heroImg(rivalHero(r),"big")}<h2>${r.n}</h2></div>
  <ul class="kv"><li><span>Pokale</span><b>${r.t}</b></li><li><span>Deck</span><b>${deckInfo(dk)}</b></li><li><span>Bei Sieg</span><b>+${trophyDelta(S.tr,r.t,true)} Pokale · ${20+S.table.lg*5} Gold</b></li><li><span>Bei Niederlage</span><b>${trophyDelta(S.tr,r.t,false)} Pokale · 5 Gold</b></li></ul>
  <h3>Sein Deck</h3><div class="grid g4">${dk.map(c=>`<div class="tile">${cardHTML(c)}</div>`).join('')}</div>
  <div class="row-btns"><button class="btn" data-act="close">Zurück</button><button class="btn primary" data-act="duel" data-id="${r.s}">Duell starten</button></div>`);
}
function sheetCard(id){
  if(S.skinNew&&S.skinNew[id]){ delete S.skinNew[id]; persist(); setTimeout(()=>{ if(tab==='album') render(); },0); }
  const d=CARD[id], o=S.cards[id]; if(!o) return; const kws=kwLong(kwOf(id,o.star)), inD=deck().includes(id), full=deck().length>=DECK_MAX, cap=o.star*5, now=stats(id,o.lvl,o.star), have=S.items[d.cat][d.r], iname=itemName(d.cat,d.r);
  let act='';
  if(o.lvl<cap){ const c=lvlCost(o.lvl), nx=stats(id,o.lvl+1,o.star), mi=Math.max(0,c.n-have), mg=Math.max(0,c.g-S.gold);
    act=`<button class="btn primary block" data-act="levelUp" data-id="${id}" ${canLevel(id)?'':'disabled'}>${canLevel(id)?`Auf Level ${o.lvl+1} · ${c.n} ${iname} · ${fmt(c.g)} Gold`:`Level ${o.lvl+1}: es fehlen ${[mi?mi+' '+iname:'',mg?fmt(mg)+' Gold':''].filter(Boolean).join(' und ')}`}</button><p class="muted center">Danach ${nx.a} Angriff · ${nx.h} Leben</p>`; }
  else if(o.star<MAXSTAR) act=`<p class="capnote">Level ${o.lvl} ist die Grenze für ${'★'.repeat(o.star)}. Verbessere die Kreatur, um weiter zu leveln.</p>`;
  if(o.star<MAXSTAR){ const u=STAR_UP[o.star+1], nx=stats(id,o.lvl,o.star+1), md=Math.max(0,u.d-o.dup), mg=Math.max(0,u.g-S.gold);
    act+=`<button class="btn primary block" data-act="starUp" data-id="${id}" ${canStar(id)?'':'disabled'}>${canStar(id)?`Verbessern auf ${'★'.repeat(o.star+1)} · ${u.d} Doppelte · ${fmt(u.g)} Gold`:`Verbessern: es fehlen ${[md?md+' Doppelte':'',mg?fmt(mg)+' Gold':''].filter(Boolean).join(' und ')}`}</button><p class="muted center">Danach ${nx.a} Angriff · ${nx.h} Leben, Level bis ${cap+5} möglich</p>`; }
  if(o.star>=MAXSTAR&&o.lvl>=cap) act='<p class="muted">Höchststand erreicht. Weitere Doppelte werden zu Gold.</p>';
  const own=ownSkins(id), cur=skinOn(id);
  const skin=own.length?`<div class="skinsel"><span>Motiv${SKINS[id]>1?` <small>${own.length} von ${SKINS[id]} gefunden</small>`:''}</span><div class="row-btns"><button class="btn${cur?'':' primary'}" data-act="skinSel" data-id="${id}:0">Standard</button>${own.map(v=>`<button class="btn${cur===v?' primary':''}" data-act="skinSel" data-id="${id}:${v}">✦ ${SKINS[id]>1?skinName(id,v):'Sondermotiv'}</button>`).join('')}</div></div>`:'';
  openSheet(`<div class="cardhead"><div><button class="artbtn" data-act="artOpen" data-id="${id}" aria-label="Bild groß ansehen">${cardHTML({id,lvl:o.lvl,star:o.star})}<span class="zoom">⤢ Groß ansehen</span></button></div><div><p class="eyebrow">${CATS[d.cat]} · Set ${SETS[d.set].n} · ${RAR[d.r]}</p><h2>${d.n}</h2>
  <p class="lore">„${LORE[id]}“</p><ul class="kv"><li><span>Level</span><b>${o.lvl} von ${cap}</b></li><li><span>Sterne</span><b>${'★'.repeat(o.star)}</b></li><li><span>Angriff / Leben</span><b>${now.a} / ${now.h}</b></li><li><span>Doppelte</span><b>${o.dup}</b></li><li><span>${itemIcon(d.cat,d.r,18)} ${iname}</span><b>${have}</b></li></ul>
  <p class="muted">${elLine(d.cat)}</p>${kws.length?`<ul class="gloss">${kws.map(k=>`<li>${k}</li>`).join('')}</ul>`:'<p class="muted">Keine Fähigkeiten, dafür kräftige Werte.</p>'}<p class="muted setbon"><b>Set ${SETS[d.set].n}:</b> ab 3 Karten ${SET_BONUS[d.set][0]}. Mit allen 6: ${SET_BONUS[d.set][1]}.</p></div></div>
  <div class="decknum"><span>Deck ${S.di+1}</span><button class="btn${inD?'':' primary'}" data-act="deckToggle" data-id="${id}" ${!inD&&full?'disabled':''}>${inD?'Herausnehmen':full?'Deck ist voll':'Ins Deck legen'}</button></div>
  ${skin}${act}<button class="btn" data-act="close">Schließen</button>`);
}
/* ====== Truhe aufdecken: Karte für Karte umdrehen ====== */
let LQ=null;
function chestSnd(it){ sfx('chest'); const t=it&&it.res&&it.res.type; if(t==='gold'||(it&&it.res&&it.res.name&&/Event/.test(it.res.name))) setTimeout(()=>sfx('rare1'),380); }
function revealChests(items,onDone){ if(!items.length) return; LQ={items,ci:0,ki:0,flipped:false,onDone}; chestSnd(items[0]); drawReveal(); }
function drawReveal(){
  const it=LQ.items[LQ.ci], res=it.res, C=CHESTS[res.type], head=`<p class="eyebrow">${res.name||C.n}${LQ.items.length>1?` · ${LQ.ci+1} von ${LQ.items.length}`:''}</p>`;
  if(LQ.ki>=res.cards.length){
    const more=LQ.ci<LQ.items.length-1;
    openSheet(`${head}<h2>${it.t||'Das war drin'}</h2><div class="grid g5">${res.cards.map((x,k)=>x.t==='kreatur'?`<button class="loot-i" data-act="artOpen" data-id="${x.id}">${cardHTML({id:x.id,lvl:S.cards[x.id].lvl,star:S.cards[x.id].star,skin:x.skin||undefined})}${x.mult>1?`<span class="mult">×${x.mult}</span>`:''}<span class="lt ${x.skin?'sp':x.kind}">${x.skin?'✦ Sondermotiv':x.kind==='neu'?'Neu':x.kind==='dup'?'Doppelt':'+'+x.gold+' Gold'}</span></button>`:`<div class="loot-i">${lootCardHTML(x)}<span class="lt">${lootLabel(x)}</span></div>`).join('')}</div>
    <button class="btn primary block" data-act="${more?'lootNextChest':'lootDone'}">${more?'Nächste Truhe':'Fertig'}</button>`,true); return;
  }
  const x=res.cards[LQ.ki], rar=lootRar(x);
  if(!LQ.flipped){ openSheet(`${head}<h2 class="center">Karte ${LQ.ki+1} von ${res.cards.length}</h2><button class="big-back${rar>=1?' glow g'+rar:''}" data-act="lootFlip" aria-label="Karte umdrehen"><span class="back"></span></button><p class="muted center">Tippe auf die Karte, um sie umzudrehen.</p>`,true); return; }
  if(x.t!=='kreatur'){ openSheet(`${head}<div class="reveal"><div class="big"><div class="flip"><div class="fi"><div class="ff">${lootCardHTML(x)}</div><div class="fb"><span class="back"></span></div></div></div></div>
    <p class="lt neu">${lootLabel(x)}</p><h2>${lootTitle(x)}</h2><p class="muted">${lootText(x)}</p></div><button class="btn primary block" data-act="lootNext">Weiter</button>`,true); return; }
  const d=CARD[x.id], o=S.cards[x.id], kws=kwLong(kwOf(x.id,o.star));
  openSheet(`${head}<div class="reveal r${d.r}"><div class="big"><div class="flip"><div class="fi"><div class="ff${x.skin?' skinrev':''}">${cardHTML({id:x.id,lvl:o.lvl,star:o.star,skin:x.skin||undefined})}${x.mult>1?`<span class="mult big">×${x.mult}</span>`:''}${x.skin?'<span class="skinband">✦ Sondermotiv ✦</span>':''}</div><div class="fb"><span class="back"></span></div></div></div></div>
  ${x.skin?'<p class="skinnote">✦ Neues Sondermotiv freigeschaltet! ✦</p>':''}<p class="lt ${x.kind}">${kindLabel(x)}</p><h2>${d.n}</h2><p class="meta">${CATS[d.cat]} · Set ${SETS[d.set].n} · ${RAR[d.r]}${!isUnlocked(x.id)?' · noch nicht freigeschaltet':''}</p>
  <p class="lore">„${LORE[d.id]}“</p>${kws.length?`<ul class="gloss">${kws.map(k=>`<li>${k}</li>`).join('')}</ul>`:''}<p class="meta">${elLine(d.cat)}</p></div>
  <button class="btn primary block" data-act="lootNext">Weiter</button>`,true);
}

/* ====== Kampf ====== */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const T=()=>RM?120:650/S.speed;
const aliveB=id=>!!B&&battleId===id;
function describe(c){ const d=CARD[c.id], ks=kwLong(c.k).join(' '); return `<b>${d.n}</b> (${CATS[d.cat]}, Set ${SETS[d.set].n}) · ${c.a} Angriff, ${Math.max(0,c.h)} Leben${ks?' · '+ks:''}`; }
function who(s){ return s==='p'?'Dein':`${ctx.opp}s`; }
function heroName(s){ return s==='p'?'deinen Helden':ctx.opp; }
function narrate(e){
  switch(e.t){
    case 'round': return `Runde ${e.r} beginnt.`;
    case 'enter': return `${e.s==='p'?'Deine':'Gegnerische'} Karte <b>${e.n}</b> kommt auf Bahn ${e.l+1}.`;
    case 'skill': return `<b>${e.n}</b> wirkt ${e.what}.`;
    case 'clash': return `Bahn ${e.l+1} kämpft.`;
    case 'hit': return `<b>${e.by}</b> trifft <b>${e.n}</b>: ${e.d} Schaden${e.st?` <b>(Elementvorteil +${e.st} %)</b>`:''}.`;
    case 'revive': return `<b>${e.n}</b> kehrt aus dem Totenwald zurück: ${e.h} Leben.`;
    case 'die': return `<b>${e.n}</b> fällt.`;
    case 'hero': return e.why==='leer'?`<b>${e.by}</b> trifft ${heroName(e.s)} über die leere Bahn: ${e.d} Schaden.`:e.why==='flug'?`<b>${e.by}</b> fliegt über die Karte gegenüber und trifft ${heroName(e.s)}: ${e.d} Schaden.`:e.why==='durchbruch'?`Durchbruch: ${e.d} Schaden gehen auf ${heroName(e.s)}.`:e.why==='rache'?`Rache von <b>${e.by}</b>: ${e.d} Schaden an ${heroName(e.s)}.`:`Erschöpfung: ${heroName(e.s)} verliert ${e.d} Leben.`;
    case 'heal': return `<b>${e.n}</b> heilt sich um ${e.d}.`;
    case 'heroheal': return `${e.s==='p'?'Dein Held':ctx.opp} heilt sich um ${e.d}.`;
    case 'buff': return e.why==='wut'?`<b>${e.n}</b> wird wütend: +${e.d} Angriff.`:e.why==='wachsen'?`<b>${e.n}</b> schlägt tiefere Wurzeln: +${e.d} Angriff.`:`<b>${e.n}</b> erhält +${e.d} Angriff.`;
  }
  return '';
}
function setInfo(html){ narr=html; if(B&&html&&narrLog[narrLog.length-1]!==html){ narrLog.push(html); if(narrLog.length>400) narrLog.shift(); } if(infoCard) return; const p=$('#b-info'); if(p) p.innerHTML=html; }
function infoText(){ return infoCard?describe(infoCard):(narr||'Der Kampf läuft automatisch. Tippe eine Karte an, um sie zu lesen.'); }
function heroHTML(s){
  const H=B[s], pct=Math.max(0,H.hp/H.maxHp*100);
  const hk=s==='p'?S.hero:(ctx.mode==='arena'&&ctx.rival?rivalHero(ctx.rival):'');
  return `<div class="hero" id="hero-${s}">${hk?heroImg(hk,'hb'):''}<b class="h-n">${s==='p'?esc(S.name):ctx.opp}</b><span class="hpbar"><i style="width:${pct}%"></i></span><span class="hpnum">${H.hp}</span></div>`;
}
function pileHTML(s){
  const P=B[s].pile, nx=P[0];
  return `<div class="pile">${nx?`<span class="mini" data-info="${s}:pile">${cardHTML(nx)}</span>`:`<span class="mini"><span class="empty-slot" style="font-size:10px">leer</span></span>`}<span>Als Nächstes<br><b>${P.length}</b> im Stapel</span></div>`;
}
function resultHTML(){
  const r=result, arena=ctx.mode==='arena'; let lines='';
  if(arena) lines+=`<p class="r-line">${r.tr>=0?'+':'−'}${Math.abs(r.tr)} Pokale <small>jetzt ${S.tr}</small></p>`;
  if(r.chal) lines+=`<p class="r-line">${r.chal}${r.chalDone?' · <b>Herausforderung geschafft!</b>':''}</p>`;
  if(r.chalAll) lines+=`<p class="r-line">Alle drei Herausforderungen der Woche geschafft: Goldtruhe!</p>`;
  if(r.evPts) lines+=`<p class="r-line"><img src="${medal(r.evPts.tier)}" alt="" width="30" height="30">+${r.evPts.n} ${EV_TN[r.evPts.tier]}punkt${r.evPts.n>1?'e':''}${r.evPts.rep?' (Wiederholung)':''}</p>`;
  if(r.evOld) lines+=`<p class="muted">Das Event ist inzwischen gewechselt.</p>`;
  if(r.gold) lines+=`<p class="r-line"><span class="coin"></span>+${r.gold} Gold${r.bonus?` <small>davon ${r.bonus} für den 3. Stern</small>`:''}</p>`;
  if(r.star2) lines+=`<p class="muted">2. Stern: +${r.star2.n} ${itemName(r.star2.cat,r.star2.q)} extra</p>`;
  if(r.gems) lines+=`<p class="r-line"><span class="gem"></span>+${r.gems} Glutsteine</p>`;
  if(r.items&&r.items.length) lines+=`<div class="ichips">${itemsLine(r.items)}</div>`;
  if(r.promo) lines+=`<p class="r-line">Aufstieg in die ${r.promo}</p>`;
  if(r.foeSet) lines+=`<p class="r-line">👑 Gebiet heroisch bezwungen: das Set „${r.foeSet}“ gehört jetzt dir!</p>`;
  if(r.foeSkin) lines+=`<p class="r-line">✦ Dazu ein Sondermotiv für ${r.foeSkin}.</p>`;
  if(r.champ) lines+=`<p class="r-line">🏆 Kartenrücken „Champion“ freigeschaltet!</p>`;
  if(r.demo) lines+=`<p class="r-line">Abstieg in die ${r.demo}</p><p class="muted">Du startest in der Mitte der Liga.</p>`;
  if(r.xp) lines+=`<p class="r-line"><span class="xpi">EP</span>+${r.xp} Erfahrung${r.lvup?` <small>Level ${r.lvup} erreicht!</small>`:''}</p>`;
  if(r.chests.length) lines+=`<p class="r-line"><img src="bilder/truhe-${r.chests[r.chests.length-1]}.png" alt="" width="34" height="34">${r.chests.map(t=>CHESTS[t].n).join(' und ')} <small>liegt im Laden</small></p>`;
  if(r.setOpen) lines+=`<p class="muted">Alle Karten des Sets ${SETS[r.setOpen].n} liegen jetzt in Truhen. Heroische Gefechte sind freigeschaltet.</p>`;
  const un=r.unlock?`<div class="unlock">${cardHTML({id:r.unlock,lvl:1,star:1})}<div><p class="eyebrow">Neue Karte freigeschaltet</p><h3>${CARD[r.unlock].n}</h3><p class="muted">Sie liegt jetzt in deiner Sammlung und kann ab sofort in Truhen auftauchen.</p></div></div>`:'';
  const showStars=r.win&&!arena;
  return `<div class="result" role="dialog" aria-modal="true"><div class="r-box"><p class="eyebrow">${ctx.title}</p>
  <h2 class="r-h ${r.win?'win':'lose'}">${r.win?'Sieg':'Niederlage'}</h2>${arena?`<p class="muted">gegen ${ctx.opp}</p>`:''}${showStars?starsHTML(r.stars,'big'):''}
  ${showStars?`<p class="muted">${r.stars===3?'Alle drei Karten stehen noch.':r.stars===2?'Zwei Karten stehen noch.':'Nur eine Karte steht noch, oder keine.'}</p>`:''}
  <div class="r-lines">${lines}</div>${un}
  ${r.win?'':'<p class="muted">Sieh dir das gegnerische Deck an und achte auf die Elemente. Leveln kannst du unter „Deck“.</p>'}
  <div class="row-btns">${ctx.mode==='heraus'?`<button class="btn" data-act="leave">Zur Arena</button>${(chState().prog[ctx.w.rid]||0)<3?`<button class="btn primary" data-act="chNext">${r.win?'Nächster Kampf':'Nochmal'}</button>`:''}`:arena?'<button class="btn" data-act="leave">Zur Arena</button><button class="btn primary" data-act="nextduel">Nächstes Duell</button>':`<button class="btn" data-act="again">Nochmal</button><button class="btn primary" data-act="leave">${ctx.mode==='event'?'Zum Event':'Zur Kampagne'}</button>`}</div></div></div>`;
}
function battleShell(){
  $('#b-root').innerHTML=`<div class="b-top"><button data-act="giveup" id="b-giveup">Aufgeben</button><b>${ctx.title}</b><button data-act="speed" id="b-speed" aria-label="Tempo ändern">Tempo ${S.speed}×</button></div>
  <div id="b-dyn"></div><div id="b-tip"></div><div id="b-result"></div>`;
}
function renderBattle(){
  const adv=(s,l)=>{ const c=B[s].lanes[l], o=B[other(s)].lanes[l]; if(!c||!o||(c.k.flug&&!o.k.flug)||!strongVs(c,o)) return ''; return `<span class="adv" title="Elementvorteil">×${strongMult(c)}</span>`; };
  const slot=(s,l)=>{ const c=B[s].lanes[l]; return `<span class="slot" data-s="${s}" data-l="${l}" data-info="${s}:${l}">${c?cardHTML(c):''}${adv(s,l)}</span>`; };
  $('#b-dyn').innerHTML=`<div class="pilebar">${heroHTML('e')}${pileHTML('e')}</div>
  <div class="board"><div class="row">${[0,1,2].map(l=>slot('e',l)).join('')}</div><div class="midline">Runde ${Math.max(1,B.round)}</div><div class="row">${[0,1,2].map(l=>slot('p',l)).join('')}</div></div>
  <div class="pilebar">${heroHTML('p')}${pileHTML('p')}</div>
  <p class="info" id="b-info" aria-live="polite">${infoText()}</p><button class="b-log" data-act="battleLog" title="Kampfprotokoll" aria-label="Kampfprotokoll öffnen">☰</button>`;
  $('#b-result').innerHTML=result?resultHTML():'';
}
function cardEl(s,l){ return document.querySelector(`#b-root .slot[data-s="${s}"][data-l="${l}"] .card`); }
function slotEl(s,l){ return document.querySelector(`#b-root .slot[data-s="${s}"][data-l="${l}"]`); }
function ghosts(){ const g={}; if(skip) return g; document.querySelectorAll('#b-root .slot .card').forEach(el=>{ const p=el.parentElement; g[p.dataset.s+p.dataset.l]=el.outerHTML; }); return g; }
function floatAt(el,txt,cls){
  if(!el) return; const r=el.getBoundingClientRect(), f=document.createElement('span');
  f.className='float '+cls; f.textContent=txt; f.style.left=(r.left+r.width/2)+'px'; f.style.top=(r.top+r.height/2)+'px';
  $('#fx').appendChild(f); setTimeout(()=>f.remove(),900);
}
async function tip(key){
  if(!S.tut||skip||S.tipSeen[key]||!TIPS[key]) return;
  S.tipSeen[key]=1; if(Object.keys(TIPS).every(k=>S.tipSeen[k])) S.tut=false; persist();
  $('#b-tip').innerHTML=`<div class="tip" role="dialog" aria-live="polite"><b>Kurz erklärt</b><span>${TIPS[key]}</span><button class="btn" data-act="tipOk">Verstanden</button></div>`;
  await new Promise(r=>tipDone=r); $('#b-tip').innerHTML='';
}
function count(ev){
  ev.forEach(e=>{
    if(e.t==='enter'&&e.s==='p') track('field:'+CARD[B.p.lanes[e.l]?.id||'funkenwicht'].set);
    else if(e.t==='die'&&e.s==='e') track('kill');
    else if(e.t==='hit'&&e.st&&e.s==='e') track('strong');
  });
}
/* Zeigt die Ereignisse eines Schritts. Gefallene Karten werden als „Geist“ kurz zurückgelegt, damit man den Treffer sieht. */
async function anim(ev,g){
  count(ev);
  if(skip) return;
  const died=new Set(ev.filter(e=>e.t==='die').map(e=>e.s+e.l)), entered=new Set();
  const ghostIn=(s,l)=>{ const k=s+l; let el=cardEl(s,l); if((!el||entered.has(k))&&died.has(k)&&g&&g[k]){ const sl=slotEl(s,l); sl.innerHTML=g[k]; el=sl.querySelector('.card'); } return el; };
  for(const e of ev){
    if(skip) return;
    const txt=narrate(e); if(txt) setInfo(txt);
    if(e.t==='round'){ const m=document.querySelector('#b-root .midline'); if(m) m.textContent='Runde '+e.r; await wait(T()*.5); }
    else if(e.t==='enter'){ entered.add(e.s+e.l); if(died.has(e.s+e.l)) continue; renderBattle(); const el=cardEl(e.s,e.l); el&&el.classList.add('pop'); sfx('place'); await wait(T()*.7); }
    else if(e.t==='skill'){ const el=cardEl(e.s,e.l); el&&el.classList.add('buff'); sfx('skill'); await wait(T()*.5); }
    else if(e.t==='clash'){ const a=cardEl('p',e.l), b=cardEl('e',e.l); a&&a.classList.add(e.fly.p?'swoop-up':'lunge-up'); b&&b.classList.add(e.fly.e?'swoop-dn':'lunge-dn'); await wait(T()*(e.fly.p||e.fly.e?.75:.45)); }
    else if(e.t==='hit'){ const el=ghostIn(e.s,e.l); if(el){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); const hp=el.querySelector('.hp'); if(hp){ hp.textContent=e.h!=null?e.h:Math.max(0,+hp.textContent-e.d); hp.classList.add('hurt'); } } sfx(e.st?'crit':'hit'); burstAt(el||slotEl(e.s,e.l),e.st?1.6:1); floatAt(el||slotEl(e.s,e.l),(e.d>0?'−'+e.d:'0')+(e.st?'!':''),e.st?'crit':'dmg'); await wait(T()*.7); if(e.st&&e.s==='e') await tip('strong'); }
    else if(e.t==='die'){ const el=ghostIn(e.s,e.l); if(el){ el.classList.add('dying'); } sfx('die'); await wait(T()*.6); }
    else if(e.t==='hero'){ const h=$('#hero-'+e.s); if(h){ h.classList.add('flash'); const n=h.querySelector('.hpnum'); n.textContent=B[e.s].hp; h.querySelector('.hpbar i').style.width=Math.max(0,B[e.s].hp/B[e.s].maxHp*100)+'%'; floatAt(n,'−'+e.d,'dmg'); } sfx('hero'); await wait(T()*.7); if(e.why==='leer') await tip('hero'); }
    else if(e.t==='heal'){ const el=cardEl(e.s,e.l); if(el){ floatAt(el,'+'+e.d,'heal'); const hp=el.querySelector('.hp'); if(hp) hp.textContent=e.h!=null?e.h:+hp.textContent+e.d; } sfx('heal'); await wait(T()*.45); }
    else if(e.t==='revive'){ const el=ghostIn(e.s,e.l); if(el){ el.classList.remove('dying'); floatAt(el,'+'+e.h,'heal'); const hp=el.querySelector('.hp'); if(hp){ hp.textContent=e.h; } } sfx('heal'); await wait(T()*.6); }
    else if(e.t==='heroheal'){ const h=$('#hero-'+e.s); h&&floatAt(h.querySelector('.hpnum'),'+'+e.d,'heal'); sfx('heal'); await wait(T()*.45); }
    else if(e.t==='buff'){ const el=cardEl(e.s,e.l); if(el){ el.classList.add('buff'); floatAt(el,'+'+e.d,'buffn'); const at=el.querySelector('.atk'); if(at){ at.textContent=+at.textContent+e.d; at.classList.add('up'); } } await wait(T()*.45); }
  }
  renderBattle(); await wait(T()*.35);
}
async function runBattle(id){
  setInfo('Beide Seiten legen drei Karten aufs Feld.'); renderBattle(); await wait(T()*.8);
  await tip('start');
  let guard=0;
  while(aliveB(id)&&!B.over&&guard++<80){
    await anim(roundStart(B),ghosts()); if(!aliveB(id)||B.over) break;
    for(let l=0;l<LANES;l++){ const g=ghosts(), ev=fightLane(B,l); if(ev.length){ await anim(ev,g); if(B&&B.round===1&&l===0) await tip('clash'); } if(!aliveB(id)||B.over) break; }
  }
  if(aliveB(id)&&!B.over){ B.over='e'; }
  if(aliveB(id)) finish();
}
function startBattle(c){
  if(c.mode!=='heraus'&&deck().length<DECK_MIN){ toast(`Dein Deck braucht mindestens ${DECK_MIN} Karten.`); tab='deck'; render(); return; }
  closeSheet(); ctx=c; result=null; infoCard=null; narr=''; narrLog=[]; skip=false; forfeit=false;
  B= c.mode==='arena' ? newBattle(deckObjs(),rivalDeck(c.rival)) : c.mode==='heraus' ? newBattle(c.pDeck,c.eDeck) : c.mode==='event' ? newBattle(deckObjs(),evDeck(c.stage),c.stage.hp) : newBattle(deckObjs(),stageDeck(c.stage,c.hero),stageHp(c.stage,c.hero));
  if(c.mode==='heraus'){ const R=c.rule; if(R.noHero){ B.p.hp=B.p.maxHp=1; } if(R.eShield) B.e.pile.concat(B.e.lanes).forEach(x=>{ if(x) x.k.schild=(x.k.schild||0)+1; }); if(R.decay) B.decay=R.decay; }
  $('#battle').hidden=false; if(FXC.cv) fxSize(); battleShell(); renderBattle();
  { const mc=(c.mode==='kampagne'||c.mode==='event')&&c.stage.boss?'endgegner':'kampf'; music(mc,curCat!==mc); }
  runBattle(++battleId);
}

/* ====== Bossauftritt vor Endgegner-Kämpfen ====== */
let BI=null;
function bossIntro(st,hero,then){
  const b=BASE.find(c=>c.set===st.set&&c.r===3), A=AREAS[st.area], line=((DLG[st.id]||[]).find(l=>l[0]==='g')||[])[1]||'';
  const el=$('#bossin'); el.hidden=false;
  el.innerHTML=`<div class="bi-bg" style="background-image:url(bilder/${A.img}.jpg)"></div><div class="bi-in"><p class="eyebrow">${A.n}${hero?' · Heroisch':''}</p>${heroImg(b.id,'bi-pt')}<h1>${CARD[b.id].n}</h1>${line?`<p class="bi-line">„${esc(kb(line))}“</p>`:''}</div><button class="sq-skip" data-act="bossSkip">Weiter</button>`;
  music('endgegner',true); setTimeout(()=>sfx('hero'),650);
  setTimeout(()=>{ document.body.classList.remove('quake'); void document.body.offsetWidth; document.body.classList.add('quake'); setTimeout(()=>document.body.classList.remove('quake'),600); },650);
  let fin=false; BI={done(){ if(fin) return; fin=true; clearTimeout(BI.t); el.classList.add('out'); setTimeout(()=>{ el.hidden=true; el.classList.remove('out'); el.innerHTML=''; BI=null; then(); },350); }};
  BI.t=setTimeout(()=>BI&&BI.done(),Math.max(3800,line.length*70));
}
function startDuel(seed){ const r=S.table.rivals.find(x=>x.s===seed)||byDist()[0]; startBattle({mode:'arena',rival:r,title:'Arena · '+LEAGUES[S.table.lg].n,opp:r.n}); }
function stageDialog(st,hero){
  const lines=DLG[st.id]||[];
  openSheet(`<p class="eyebrow">${AREAS[st.area].n} · Gefecht ${st.i+1}${hero?' · Heroisch':''}</p><h2>${st.n}</h2><div class="dlg">${lines.map(([w,t])=>w==='g'?`<div class="line">${foeAv(st)}<div class="bubble"><b>${st.n}</b>${kb(t)}</div></div>`:`<div class="line p"><div class="bubble"><b>${esc(S.name)}</b>${kb(t)}</div>${heroImg(S.hero)}</div>`).join('')}</div>
  <div class="row-btns"><button class="btn" data-act="close">Zurück</button><button class="btn primary" data-act="fightGo" data-id="${st.id}${hero?'h':''}">Kampf beginnen</button></div>`);
}
function startStage(id,hero){ const st=STAGES.find(s=>s.id===id); if(!st||!isOpen(st)) return; if(deck().length<DECK_MIN){ startBattle({}); return; } stageDialog(st,hero); }
function finish(){
  const win=B.over==='p', r={win,gold:0,chests:[],items:[]};
  if(!forfeit){ S.stat.fights++; S.stat.kills+=B.e.lost||0; }
  const xpBefore=S.plvl;
  if(win){ r.stars=stars(B); track('win'); S.wins++; if(new Set(deckObjs().map(c=>CARD[c.id].cat)).size===1) track('mono'); if(ctx.mode==='kampagne'&&r.stars===3){ track('three'); S.flags.three=1; } const lv=setLevels(deckObjs()); if(Object.values(lv).some(v=>v>=1)) S.flags.set3=1; if(Object.values(lv).some(v=>v>=2)) S.flags.set6=1; }
  if(ctx.mode==='kampagne'){
    const st=ctx.stage;
    if(win){
      /* Grundbelohnung: Gold + 1 Gegenstand (immer). Erstmals 2 Sterne: +1 Gegenstand. Erstmals 3 Sterne: +Gold. */
      const H=!!ctx.hero, store=H?S.hstars:S.stars, prev=store[st.id]||0, it=stageItem(st,H), g=Math.round(st.gold*(H?HERO_GOLD:1));
      r.gold=g; r.items=[Object.assign({},it)];
      if(r.stars>=2&&prev<2){ r.items.push(Object.assign({},it)); r.star2=it; }
      if(r.stars>=3&&prev<3){ r.bonus=Math.round(g*.5); r.gold+=r.bonus; }
      r.xp=XP.win+XP.star*Math.max(0,r.stars-prev); if(H) track('heroWin');
      if(r.stars>prev) store[st.id]=r.stars;
      /* Alle 16 Gefechte eines Gebiets heroisch mit 3 Sternen: das Gegner-Set gehört dir. */
      if(H){ const A=AREAS[st.area], all=STAGES.filter(x=>x.area===st.area).every(x=>S.hstars[x.id]===3);
        if(all&&!S.foeSets.includes(A.foe)){ S.foeSets.push(A.foe); BASE.filter(c=>c.set===A.foe).forEach(c=>{ if(!S.cards[c.id]) S.cards[c.id]={lvl:1,star:1,dup:0}; }); r.foeSet=SETS[A.foe].n;
          (A.heroSkin||[]).forEach(([id,v])=>{ if(!ownSkins(id).includes(v)){ S.skins[id]=ownSkins(id).concat(v).sort(); S.skinOn[id]=v; (S.skinNew=S.skinNew||{})[id]=1; r.foeSkin=CARD[id].n; } }); } }
      if(!H&&!prev){
        if(st.unlock){ if(!S.unlocked.includes(st.unlock)) S.unlocked.push(st.unlock); if(!S.cards[st.unlock]) S.cards[st.unlock]={lvl:1,star:1,dup:0}; r.unlock=st.unlock; }
        if(st.boss){ if(!S.setsOpen.includes(st.set)) S.setsOpen.push(st.set); r.setOpen=st.set; r.chests.push('gold'); r.src='kampagne'; S.gems+=GEM_BOSS; r.gems=GEM_BOSS; }
      }
      const m={}; r.items.forEach(x=>{ const k=x.cat+x.q; if(m[k]) m[k].n+=x.n; else m[k]=Object.assign({},x); }); r.items=Object.values(m);
    }else{ r.gold=forfeit?0:5; r.xp=forfeit?0:XP.lose; }
  }else if(ctx.mode==='event'){
    const E=ev(), st=ctx.stage;
    if(win&&E.day===ctx.day){ const prev=E.st[st.k]||0, n=Math.max(0,r.stars-prev); track('evWin'); if(r.stars===3) track('evThree');
      if(n){ E.pts[st.tier]+=n; E.st[st.k]=r.stars; r.evPts={tier:st.tier,n}; }
      else{ /* Wiederholung: 1 Bronze, Bosse dreimal am Tag 1 Silber. */ E.rep=E.rep||{}; const k=st.k, used=E.rep[k]||0, t=st.boss&&used<3?1:0; if(st.boss) E.rep[k]=used+1; E.pts[t]++; r.evPts={tier:t,n:1,rep:1}; }
      r.xp=XP.win+XP.star*n; }
    else{ r.xp=forfeit?0:XP.lose; if(win) r.evOld=1; }
  }else if(ctx.mode==='heraus'){
    const ch=chState(), w=ctx.w; r.chal=`${txt(ctx.rule.n,w.p)} · Kampf ${ctx.k+1} von 3`;
    if(win&&(ch.prog[w.rid]||0)===ctx.k){ ch.prog[w.rid]=ctx.k+1; r.gold=20+10*ctx.k; r.xp=XP.win;
      if(ctx.k+1===3){ r.chests.push('silber'); r.src='heraus'; r.chalDone=1; if(!ch.all&&weekRules().every(x=>(ch.prog[x.rid]||0)>=3)){ ch.all=1; r.chests.push('gold'); r.chalAll=1; } } }
    else{ r.gold=forfeit?0:5; r.xp=forfeit?0:XP.lose; }
  }else{
    const rv=ctx.rival, lg=S.table.lg, d=trophyDelta(S.tr,rv.t,win), before=S.tr;
    S.tr=Math.max(0,S.tr+d); r.tr=S.tr-before;
    /* Abstieg: Wer unter die Liga fällt, startet in der Mitte der Liga darunter. */
    if(!win&&lg>0&&S.tr<LEAGUES[lg].lo){ const L=LEAGUES[lg-1]; S.tr=Math.round(L.lo+(LEAGUES[lg].lo-L.lo)*.5); r.tr=S.tr-before; r.demo=L.n; S.table=mkTable(lg-1); }
    r.xp=win?XP.arena:forfeit?0:XP.lose; if(!forfeit) track('arenaFight');
    if(win){ track('arenaWin'); S.aw++; r.gold=20+lg*5; rv.t=Math.max(LEAGUES[lg].lo,rv.t-Math.round(d/2)); if(S.aw%WIN_CHEST_EVERY===0) r.chests.push('holz'); r.src='arena'; }
    else{ S.al++; r.gold=forfeit?0:5; rv.t+=Math.round(-d/2); }
    drift(rv);
    const now=leagueOf(S.tr);
    if(now>lg){ S.table=mkTable(now); r.promo=LEAGUES[now].n; S.seasonBest=Math.max(S.seasonBest,now); if(now>S.league){ S.league=now; S.gems+=GEM_PROMO; r.gems=GEM_PROMO; r.chests.push('gold'); if(now>=4&&!S.backs.includes('champion')){ champCheck(); r.champ=1; } } }
  }
  addXp(r.xp||0); if(S.plvl>xpBefore) r.lvup=S.plvl;
  if(ctx.mode==='arena') r.src='arena'; giveItems(r.items); r.chests.forEach(t=>S.chests.push(r.src?{type:t,src:r.src}:{type:t}));
  addGold(r.gold); persist(); result=r; skip=false; renderBattle();
  stopMusic(); jingle(r.promo?'aufstieg':win?'sieg':'niederlage',true);
}
function leaveBattle(){ setTimeout(flushAch,300); setTimeout(()=>{ if(evPend.length){ toast(evPend.join(' · ')); evPend=[]; } },900); setTimeout(showLvUp,400); B=null; battleId++; result=null; skip=false; $('#b-tip').innerHTML=''; $('#battle').hidden=true; $('#fx').innerHTML=''; if(FXC.cv) fxSize(); render(); music(tabMusic()); }

/* ====== Bedienung ====== */
const ACT={
  tab(id,el){ tab=el.dataset.tab; sfx('tap'); render(); $('#view').scrollTop=0; music(tabMusic()); },
  mute(){ S.muted=!S.muted; persist(); applyVol(); render(); },
  settings(){ sfx('tap'); sheetSettings(); },
  stage(id){ sfx('tap'); sheetStage(+id); },
  fight(id){ startStage(+id,false); },
  mapGo(id){ const a=+id; if(!areaKnown(a)) return; if(a>mapArea&&!areaDone(mapArea)) return; mapArea=a; sfx('flip'); render(); },
  seqNext(){ seqNext(); }, seqSkip(){ seqEnd(); },
  replaySeq(id){ playSeq(id); }, replayStory(id){ const a=+id; if(SQ||!areaKnown(a)) return; playChain(areaStory(a)); },
  fightHero(id){ startStage(+id,true); },
  fightGo(id){ const hero=String(id).endsWith('h'), st=STAGES.find(s=>s.id===parseInt(id)); const go=()=>startBattle({mode:'kampagne',stage:st,hero,title:`${st.n}${hero?' · Heroisch':''}`,opp:st.n}); if(st.boss&&deck().length>=DECK_MIN){ closeSheet(); bossIntro(st,hero,go); } else go(); },
  bossSkip(){ if(BI) BI.done(); },
  rival(id){ sfx('tap'); sheetRival(+id); },
  duel(id){ startDuel(+id); },
  nextduel(){ startDuel(byDist()[0].s); },
  card(id){ sfx('tap'); sheetCard(id); },
  fcat(id){ fCat=id; render(); },
  fset(id){ fSet=id; render(); },
  shopTab(id){ shopTab=id; render(); },
  close(){ closeSheet(); },
  battleLog(){ openSheet(`<div class="sec-h"><h2>Kampfprotokoll</h2><button class="btn" data-act="close">Schließen</button></div><ol class="blog">${narrLog.length?narrLog.map(t=>`<li>${t}</li>`).join(''):'<li class="muted">Noch nichts passiert.</li>'}</ol>`); const l=document.querySelector('.blog'); if(l) l.scrollTop=l.scrollHeight; },
  tipOk(){ if(tipDone){ const f=tipDone; tipDone=null; f(); } },
  tutReset(){ S.tut=true; S.tipSeen={}; persist(); toast('Das Tutorial erscheint im nächsten Kampf.'); },
  claim(){ const d=daily(); if(d.claimed||!dailyDone()) return; d.claimed=true; S.chests.push({type:'silber'}); addXp(XP.daily); persist(); render(); toast(`Die Silbertruhe liegt jetzt im Laden. +${XP.daily} Erfahrung.`); setTimeout(showLvUp,300); },
  openOwned(id){ const i=+id, x=S.chests[i]; if(!x) return; S.chests.splice(i,1); const res=openChest(x.type,0,{src:x.src}); if(x.src) res.name=SRC_N[x.src]+'-'+CHESTS[x.type].n; persist(); render(); revealChests([{t:'',res}],()=>render()); },
  achClaim(id){ const a=ACH.find(x=>x.id===id); if(!a||S.ach[id]!==1) return; S.ach[id]=2; S.gems+=a.g; persist(); render(); sfx('coin'); },
  albumFold(id){ if(albumOpenSets.has(id)) albumOpenSets.delete(id); else albumOpenSets.add(id); render(); },
  quickWin(id){
    const H=String(id).endsWith('h'), st=STAGES.find(x=>x.id===parseInt(id)); if(!st) return; const store=H?S.hstars:S.stars;
    if(store[st.id]!==3||S.skips<1) return;
    S.skips--; const it=stageItem(st,H), g=Math.round(st.gold*(H?HERO_GOLD:1)); giveItems([it]); addGold(g); track('win'); track('three'); S.wins++; persist(); render(); sfx('coin');
    openSheet(`<p class="eyebrow">Schnellsieg${H?' · Heroisch':''}</p><h2>${st.n}</h2><p class="r-line center"><span class="coin"></span>+${g} Gold</p><div class="ichips">${itemsLine([it])}</div><p class="muted center">Noch ${S.skips} Schnellsieg-Rolle${S.skips===1?"":"n"}.</p><div class="row-btns"><button class="btn" data-act="close">Fertig</button><button class="btn primary" data-act="quickWin" data-id="${id}" ${S.skips>0?'':'disabled'}>Noch einmal</button></div>`);
  },
  albumClaim(id){ if(!allOf(id)||S.album[id]) return; S.album[id]=1; S.gems+=ALBUM_REWARD.gems; addGold(ALBUM_REWARD.gold); persist(); render(); sfx('coin'); toast(`Set ${SETS[id].n} vollständig: +${ALBUM_REWARD.gems} Glutsteine, +${ALBUM_REWARD.gold} Gold`); },
  rename(){ openSheet(`<h2>Dein Name</h2><label class="lbl" for="nameinput">Bis zu 16 Zeichen</label><input type="text" id="nameinput" maxlength="16" value="${esc(S.name)}" autocomplete="off"><div class="row-btns"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="renameYes">Speichern</button></div>`); },
  renameYes(){ const v=$('#nameinput').value.trim().slice(0,16); if(!v){ toast('Der Name darf nicht leer sein.'); return; } S.name=v; persist(); closeSheet(); render(); },
  deckSlot(id){ S.di=+id; persist(); render(); },
  deckToggle(id){ const d=deck(), i=d.indexOf(id); if(i>=0){ if(d.length<=DECK_MIN){ toast(`Ein Deck braucht mindestens ${DECK_MIN} Karten.`); return; } d.splice(i,1); } else{ if(!S.cards[id]||d.length>=DECK_MAX) return; d.push(id); } persist(); render(); sheetCard(id); sfx('place'); },
  skinSel(x){ const [id,v]=x.split(':'), n=+v; if(n&&!ownSkins(id).includes(n)) return; S.skinOn[id]=n; persist(); render(); sheetCard(id); },
  saveNow(){ sheetSettings(); setTimeout(()=>{ const el=$('#savecode'); if(el) el.scrollIntoView({block:'center'}); ACT.export(); },60); },
  fxToggle(){ S.fxOff=!S.fxOff; persist(); ambApply(); sheetSettings(); },
  levelUp(id){ if(!canLevel(id)) return; const o=S.cards[id], d=CARD[id], c=lvlCost(o.lvl); S.items[d.cat][d.r]-=c.n; S.gold-=c.g; o.lvl++; track('lvl:'+d.cat); persist(); render(); sheetCard(id); sfx('up'); },
  starUp(id){ if(!canStar(id)) return; const o=S.cards[id], u=STAR_UP[o.star+1]; o.dup-=u.d; S.gold-=u.g; o.star++; track('star'); persist(); render(); sheetCard(id); sfx('up'); toast(`${CARD[id].n} hat jetzt ${'★'.repeat(o.star)}.`); },
  buyChest(id){ const C=CHESTS[id]; if(!C) return; if(S.gold<C.price){ toast(`Dir fehlen ${C.price-S.gold} Gold.`); return; } S.gold-=C.price; const res=openChest(id); persist(); render(); revealChests([{t:'',res}],()=>render()); },
  lootFlip(){ LQ.flipped=true; const x=LQ.items[LQ.ci].res.cards[LQ.ki], r=lootRar(x); sfx(r>=2||x.kind==='neu'||x.skin?'coin':'flip'); if(x.skin) sfx('rare3'); else if(r>=1&&x.t==='kreatur') sfx('rare'+r); if(r===3&&x.t==='kreatur'&&!RM){ document.body.classList.remove('quake'); void document.body.offsetWidth; document.body.classList.add('quake'); } drawReveal(); },
  lootNext(){ LQ.ki++; LQ.flipped=false; drawReveal(); },
  lootNextChest(){ LQ.ci++; LQ.ki=0; LQ.flipped=false; chestSnd(LQ.items[LQ.ci]); drawReveal(); },
  lootDone(){ const f=LQ&&LQ.onDone; LQ=null; closeSheet(); f&&f(); setTimeout(showLvUp,200); },
  theme(id){
    const t=THEMES[id]; if(!t) return;
    if(S.themes.includes(id)){ S.theme=id; persist(); applyTheme(); render(); return; }
    if(S.gems<t.p){ toast(`Dir fehlen ${t.p-S.gems} Glutsteine.`); return; }
    openSheet(`<h2>${t.n} kaufen?</h2><p class="muted">Kostet ${t.p} Glutsteine. Du hast ${S.gems}.</p><div class="row-btns"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="themeYes" data-id="${id}">Kaufen und auflegen</button></div>`);
  },
  heroPick(k){ if(!HEROES[k]) return; if(S.heroes.includes(k)){ S.hero=k; if(k==='sammler') S.sex='m'; if(k==='sammlerin') S.sex='w'; persist(); render(); return; }
    if(S.gems<HERO_PRICE){ toast(`Dir fehlen ${HERO_PRICE-S.gems} Glutsteine.`); return; }
    openSheet(`<h2>${HEROES[k]} als Held?</h2><div class="center">${heroImg(k,'big')}</div><p class="muted">Kostet ${HERO_PRICE} Glutsteine. Du hast ${S.gems}.</p><div class="row-btns"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="heroYes" data-id="${k}">Kaufen und benutzen</button></div>`); },
  heroYes(k){ if(!HEROES[k]||S.heroes.includes(k)||S.gems<HERO_PRICE) return; S.gems-=HERO_PRICE; S.heroes.push(k); S.hero=k; persist(); closeSheet(); render(); sfx('coin'); },
  back(id){ const b=BACKS[id]; if(!b) return; if(S.backs.includes(id)){ S.back=id; persist(); applyTheme(); render(); return; }
    if(b.earn){ toast(b.earn+', dann gehört dir dieser Rücken.'); return; }
    if(S.gems<b.p){ toast(`Dir fehlen ${b.p-S.gems} Glutsteine.`); return; }
    openSheet(`<h2>Kartenrücken ${b.n} kaufen?</h2><img class="bkprev" src="${backSrc(id)}" alt=""><p class="muted">Kostet ${b.p} Glutsteine. Du hast ${S.gems}.</p><div class="row-btns"><button class="btn" data-act="close">Abbrechen</button><button class="btn primary" data-act="backYes" data-id="${id}">Kaufen und benutzen</button></div>`); },
  backYes(id){ const b=BACKS[id]; if(!b||S.backs.includes(id)||S.gems<b.p) return; S.gems-=b.p; S.backs.push(id); S.back=id; persist(); applyTheme(); closeSheet(); render(); sfx('coin'); },
  artOpen(id){ artView(id); }, artPrev(){ artStep(-1); }, artNext(){ artStep(1); }, artClose(){ artClose(); },
  themeYes(id){ const t=THEMES[id]; if(!t||S.themes.includes(id)||S.gems<t.p) return; S.gems-=t.p; S.themes.push(id); S.theme=id; persist(); applyTheme(); closeSheet(); render(); sfx('coin'); },
  iap(id){ buyIAP(id); },
  export(){
    S.lastSave=Date.now(); persist(); const code='GS6.'+btoa(unescape(encodeURIComponent(JSON.stringify(S)))), ta=$('#savecode'); ta.value=code; ta.select();
    try{ navigator.clipboard.writeText(code).then(()=>toast('Code kopiert.'),()=>toast('Code steht im Feld. Markiere und kopiere ihn.')); }catch(e){ toast('Code steht im Feld. Markiere und kopiere ihn.'); }
  },
  import(){
    const raw=$('#savecode').value.trim();
    try{ if(!raw.startsWith('GS6.')) throw 0; const j=JSON.parse(decodeURIComponent(escape(atob(raw.slice(4))))); if(!j||j.v!==6) throw 0; S=sane(j); persist(); applyTheme(); applyVol(); closeSheet(); render(); renderMenu(); toast('Spielstand geladen.'); }
    catch(e){ toast('Das ist kein gültiger Code. Er beginnt mit GS6.'); }
  },
  reset(){ openSheet(`<h2>Wirklich neu anfangen?</h2><p class="muted">Karten, Pokale, Sterne, Gold und Glutsteine gehen verloren.</p><div class="row-btns"><button class="btn" data-act="close">Abbrechen</button><button class="btn danger" data-act="resetYes">Alles löschen</button></div>`); },
  resetYes(){ S=Object.assign(fresh(),{vol:S.vol,muted:S.muted}); persist(); applyTheme(); closeSheet(); tab='map'; render(); toast('Neues Spiel gestartet.'); },
  speed(id,el){ S.speed=S.speed===1?2:S.speed===2?4:1; persist(); el.textContent=`Tempo ${S.speed}×`; },
  giveup(id,el){
    if(!B||B.over) return;
    if(el.dataset.sure){ forfeit=true; skip=true; B.over='e'; if(tipDone){ const f=tipDone; tipDone=null; f(); } return; }
    el.dataset.sure='1'; el.textContent='Wirklich aufgeben?'; setTimeout(()=>{ if(el.isConnected){ delete el.dataset.sure; el.textContent='Aufgeben'; } },3000);
  },
  again(){ if(ctx.mode==='event'){ startEv(ctx.stage.k); return; } startStage(ctx.stage.id,ctx.hero); },
  chNext(){ const i=ctx.ci; leaveBattle(); startChallenge(i); },
  arenaTab(id){ arenaTab=id; sfx('tap'); render(); },
  chDeck(id){ sheetChDeck(+id); }, chGo(id){ startChallenge(+id); },
  chPick(x){ const [i,id]=x.split(':'), w=weekRules()[+i], R=RULE[w.rid], d=chDeck(w), k=w.rid+(w.p||'');
    if(d.includes(id)) S.chDecks[k]=d.filter(y=>y!==id);
    else{ if(d.length>=chMax(w)){ toast(`Höchstens ${chMax(w)} Karten.`); return; } if(R.sets&&new Set(d.concat(id).map(y=>CARD[y].set)).size>R.sets){ toast(`Nur Karten aus ${R.sets} Sets erlaubt.`); return; } S.chDecks[k]=d.concat(id); }
    persist(); sheetChDeck(+i); },
  leave(){ leaveBattle(); }
};

/* ====== Tages-Event ======
   Jeden Tag ein anderes Event-Set. 4 Abschnitte mit je 16 Gefechten: 12 normale (Bronzepunkte), 3 Elite (Silberpunkte), 1 Boss (Goldpunkte).
   Punkte gibt es pro neuem Stern. Eventtruhen kosten Punkte und enthalten immer eine Eventkarte. Um Mitternacht beginnt alles neu. */
const EV_SETS=Object.keys(SETS).filter(x=>SETS[x].ev), EV_PER=16, EV_ELITE=[4,9,13], EV_TN=['Bronze','Silber','Gold'];
const EV_MAPS={riff:[1,2,0,4],maerchen:[2,3,0,1],amazonen:[2,1,4,0],gladiatoren:[0,3,2,4],walgesang:[1,2,3,4],stationnull:[3,0,4,1],roteschlucht:[0,4,2,3],frostmark:[4,1,2,3],sternenkurs:[4,1,3,0],neonstadt:[3,0,1,4],savanne:[2,0,4,1],kirschbluete:[2,4,1,3]};
const EV_AREAS={
 walgesang:['Die Brandung','Das offene Meer','Das Riff im Mondlicht','Die lichtlose Tiefe'],
 stationnull:['Die Andockschleuse','Die Kälteschlafkammer','Die Labore','Der Reaktorkern'],
 roteschlucht:['Die Goldgräberstadt','Der Postkutschenweg','Die Felsschlucht','Die Höllenbrücke'],
 frostmark:['Die Schneefelder','Die Mammutsteppe','Das Polarlichttal','Der Gletscherberg'],
 sternenkurs:['Der Raumhafen','Der Gasnebel','Die Ozeanwelt','Der Sternenstrom'],
 neonstadt:['Die Hinterhöfe','Der Nachtmarkt','Die Hochhausdächer','Der Konzernturm'],
 savanne:['Der Termitenhügel','Das hohe Gras','Die Wasserstelle','Der Affenbrotbaum'],
 riff:['Die Lagune','Der Seegraswald','Das Korallenriff','Die Riffkante'],
 maerchen:['Der Waldrand','Das Lebkuchenhaus','Die Dornenhecke','Das Spiegelschloss'],
 amazonen:['Der Dschungelpfad','Die Wasserfälle','Das Kriegerlager','Der Thron der Königin'],
 gladiatoren:['Die Kasernen','Der Übungsplatz','Die Tierkäfige','Die große Arena'],
 kirschbluete:['Der Bambuswald','Das Teehaus','Die Tempelstufen','Der Fuchsschrein']};
const EV_CHEST=[
 {t:'holz',cost:10,n:'Event-Bronzetruhe',ev:[[0,75],[1,25]],bonus:[1,[1,2]]},
 {t:'silber',cost:6,n:'Event-Silbertruhe',ev:[[1,80],[2,20]],bonus:[2,[1,1]]},
 {t:'gold',cost:4,n:'Event-Goldtruhe',ev:[[2,85],[3,15]],bonus:null}];
const EV_TASKS=[
 {k:'evWin',g:5,t:'Gewinne 5 Event-Kämpfe'},
 {k:'evThree',g:3,t:'Gewinne 3 Event-Kämpfe mit 3 Sternen',h:1},
 {k:'lvl',g:3,t:'Levele 3-mal eine {E}-Karte auf'},
 {k:'star',g:1,t:'Verbessere eine Karte um einen Stern',h:1},
 {k:'chest',g:2,t:'Öffne 2 Truhen'},
 {k:'arenaFight',g:3,t:'Bestreite 3 Duelle in der Arena'},
 {k:'heroWin',g:1,t:'Gewinne ein heroisches Gefecht',h:1,need:()=>areaDone(0)},
 {k:'kill',g:15,t:'Besiege 15 gegnerische Karten'},
 {k:'mono',g:1,t:'Gewinne einen Kampf nur mit Karten eines Elements',h:1},
 {k:'strong',g:8,t:'Triff 8-mal mit Elementvorteil'}];
/* Schwierigkeit (abgestimmt mit tools/event-sim.js): Level-Versatz und Anstieg je Abschnitt, Heldenleben-Faktor,
   Seltenheiten der Gegner (Bronze, Silber, Gold, Diamant) passend zur Deckstärke. */
const EV_OFF=[-3,-1,0,1], EV_GR=[2,3,3,4], EV_HPF=[1,1.4,1.8,2.3], EV_ROWS=[[5,1,0,0],[3,2,1,0],[1,3,2,0],[1,2,2,0],[0,2,3,1]], EV_TOPR=[1,2,2,3,3];
function evRow(anc,a){ return Math.max(0,Math.min(4,a+(anc<=4?-1:anc>=14?1:0))); }
let evArea=null, evPend=[];
function medal(t){ const c=[['#e3a272','#7a3f16'],['#eef0f4','#7c7f8c'],['#ffe08a','#a8761e']][t]||['#ccc','#666'];
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="${c[1]}"/><circle cx="32" cy="32" r="24" fill="${c[0]}"/><path d="M32 15l5 10.2 11.2 1.6-8.1 7.9 1.9 11.2L32 40.6l-10 5.3 1.9-11.2-8.1-7.9 11.2-1.6z" fill="${c[1]}"/></svg>`); }
function evDayIdx(d){ d=d||new Date(); return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5); }
function evOrder(b){ const r=rng(hash('evb'+b)), a=EV_SETS.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
/* Alle Event-Sets kommen reihum in zufälliger Reihenfolge dran, nie zweimal hintereinander. */
function evSetFor(day){ const n=EV_SETS.length, b=Math.floor(day/n), o=evOrder(b), p=evOrder(b-1); if(o[0]===p[n-1]) [o[0],o[1]]=[o[1],o[0]]; return o[day-b*n]; }
function evTasks(day){
  const r=rng(hash('evt'+day+':'+S.uid)), pool=EV_TASKS.filter(t=>!t.need||t.need()), out=[];
  while(out.length<3&&pool.length){ const t=pool.splice(Math.floor(r()*pool.length),1)[0]; let k=t.k, txt=t.t;
    if(k==='lvl'){ const c=Object.keys(CATS)[Math.floor(r()*5)]; k='lvl:'+c; txt=txt.replace('{E}',CATS[c]); } out.push({k,g:t.g,t:txt,p:0,h:t.h?1:0}); }
  let hi=out.findIndex(t=>t.h); if(hi<0) hi=out.length-1; out.forEach((t,i)=>t.h=i===hi?1:0);
  return out;
}
/* Stärke des Events richtet sich nach dem Durchschnittslevel deines Decks beim Start des Tages. */
function evAnchor(){ try{ return deck().length?Math.max(1,deckLim().l):1; }catch(e){ return 1; } }
function ev(){
  const k=dayKey(); if(S.ev&&S.ev.day===k) return S.ev;
  S.ev={day:k,set:evSetFor(evDayIdx()),anc:evAnchor(),st:{},pts:[0,0,0],tasks:evTasks(k)}; evArea=null; return S.ev;
}
function evTrack(k,n){ const E=S.ev; if(!E||E.day!==dayKey()) return;
  E.tasks.forEach(t=>{ if(t.k!==k||t.p>=t.g) return; t.p=Math.min(t.g,t.p+(n||1)); if(t.p>=t.g){ E.pts[0]+=3; if(t.h) E.pts[1]+=2; const m=`Event-Aufgabe geschafft: +3 Bronze${t.h?', +2 Silber':''}`; if(B) evPend.push(m); else setTimeout(()=>toast(m),50); } }); }
let EVS=null;
function evStages(E){
  const key=E.day+E.set+E.anc; if(EVS&&EVS.key===key) return EVS.list;
  const top=r=>BASE.find(c=>c.set===E.set&&c.r===r), list=[];
  for(let a=0;a<4;a++) for(let i=0;i<EV_PER;i++){
    const k=a*EV_PER+i, boss=i===EV_PER-1, elite=EV_ELITE.includes(i), lvl=Math.max(1,Math.min(MAXLVL,E.anc+EV_OFF[a]+Math.floor(i*EV_GR[a]/15)+(elite?2:0)+(boss?2:0))), star=Math.min(MAXSTAR,Math.ceil(lvl/5));
    list.push({k,a,i,boss,elite,tier:boss?2:elite?1:0,lvl,star,size:Math.min(8,[3,4,5,6][a]+Math.floor(i/6)+(boss?1:0)),
      hp:Math.round((800+i*30+a*150+(boss?400:0))*EV_HPF[a]*mult(star,lvl)/10)*10, n:boss?top(EV_TOPR[evRow(E.anc,a)]).n:elite?`Elitegefecht ${i+1}`:`Gefecht ${i+1}`});
  }
  EVS={key,list}; return list;
}
function evDeck(st){
  const E=ev(), r=rng(hash('ev'+E.day+':'+st.k)), set=BASE.filter(c=>c.set===E.set), of=x=>set.filter(c=>c.r===x), pk=a=>a[Math.floor(r()*a.length)].id, ids=[];
  const R=evRow(E.anc,st.a), w=EV_ROWS[R], sum=w.reduce((x,y)=>x+y,0);
  if(st.boss) ids.push(of(EV_TOPR[R])[0].id);
  if(st.elite) ids.push(pk(of(EV_TOPR[R])));
  while(ids.length<st.size){ let v=r()*sum, x=0; while(v>=w[x]&&x<3){ v-=w[x]; x++; } ids.push(pk(of(x))); }
  return ids.map(id=>({id,lvl:st.lvl,star:st.star}));
}
function evOpen(E,k){ return k===0||(E.st[k-1]||0)>0; }
function evDot(){ const E=S.ev&&S.ev.day===dayKey()?S.ev:null; return !!E&&EV_CHEST.some((C,t)=>E.pts[t]>=C.cost); }
function evLeft(){ const n=new Date(), m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1), d=Math.max(0,m-n), h=Math.floor(d/36e5), mi=Math.floor(d%36e5/6e4); return h?`${h} Std. ${mi} Min.`:`${mi} Min.`; }
function viewEvent(){
  const E=ev(), L=evStages(E), Sx=SETS[E.set], cur=Math.min(3,Math.floor((L.find(s=>!E.st[s.k])||L[L.length-1]).k/EV_PER));
  if(evArea==null||evArea>cur) evArea=cur;
  const a=evArea, mi=EV_MAPS[E.set][a], W=MAP_PATH[mi], P=MAP_PTS[mi], list=L.filter(s=>s.a===a), reach=list.filter(s=>evOpen(E,s.k)).length, next=list.find(s=>!E.st[s.k]&&evOpen(E,s.k));
  const cards=BASE.filter(c=>c.set===E.set), have=cards.filter(c=>S.cards[c.id]).length;
  let h=`<div class="mapwrap"><div class="mapbox evmap" style="--map:url(bilder/karte-${mi+1}.jpg);--evc:${Sx.col}"><i class="evtint"></i><svg class="mpath" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="pl-all" d="${smoothPath(W)}"/>${reach>1?`<path class="pl-done" d="${smoothPath(MAP_PATH[mi].slice(0,P[reach-1][2]).concat([[P[reach-1][0],P[reach-1][1]]]))}"/>`:''}</svg>`;
  list.forEach((st,k)=>{ const got=E.st[st.k]||0, open=evOpen(E,st.k), cls=got?'done':open?'open':'locked';
    h+=`<button class="mnode ${cls}${st.boss?' boss':''}${st.elite?' elite':''}" style="left:${P[k][0]}%;top:${P[k][1]}%" data-act="evStage" data-id="${st.k}" ${open?'':'disabled'} aria-label="${open?st.n:'Noch gesperrt'}"><span class="mn"><b>${open?k+1:'?'}</b></span>${got?`<span class="mst">${starsHTML(got,'mini')}</span>`:''}${cls==='open'?`<span class="mtag">${st.n}</span>`:''}</button>`; });
  h+=`<div class="mtitle"><p class="eyebrow">Event · Abschnitt ${ROM[a+1]}</p><h2>${EV_AREAS[E.set][a]}</h2></div>`;
  if(a>0) h+=`<button class="marrow l" data-act="evGo" data-id="${a-1}">‹ ${EV_AREAS[E.set][a-1]}</button>`;
  if(a<cur) h+=`<button class="marrow r" data-act="evGo" data-id="${a+1}">${EV_AREAS[E.set][a+1]} ›</button>`;
  h+=`</div><aside class="mside"><section class="panelbox"><p class="eyebrow">Tages-Event · endet in ${evLeft()}</p><h3 style="color:${Sx.col}">${Sx.n}</h3>
  <div class="evpts">${E.pts.map((n,t)=>`<span><img src="${medal(t)}" alt="${EV_TN[t]}punkte">${n}</span>`).join('')}</div>
  ${next?`<button class="btn primary block" data-act="evStage" data-id="${next.k}">${next.n}</button>`:'<p class="muted">Abschnitt geschafft!</p>'}
  <p class="muted">Pro neuem Stern: Bronze bei normalen Gefechten, Silber bei Elite, Gold beim Boss. Um Mitternacht beginnt ein neues Event.</p></section>
  <section class="panelbox"><h3>Eventtruhen</h3><div class="evchests">${EV_CHEST.map((C,t)=>`<button class="btn${E.pts[t]>=C.cost?' primary':''}" data-act="evChest" data-id="${t}" ${E.pts[t]>=C.cost?'':'disabled'}><img src="bilder/truhe-${C.t}.png" alt="" width="34" height="34"><span>${C.n.replace('Event-','')}<small><img src="${medal(t)}" alt="" width="14" height="14">${C.cost}</small></span></button>`).join('')}</div><p class="muted">Jede Truhe enthält garantiert eine ${Sx.n}-Karte.</p></section>
  <section class="panelbox"><h3>Event-Aufgaben</h3><ul class="evtasks">${E.tasks.map(t=>`<li class="${t.p>=t.g?'ok':''}"><span>${t.p>=t.g?'✓ ':''}${t.t}</span><small>${t.p}/${t.g} · +3 B${t.h?', +2 S':''}</small></li>`).join('')}</ul></section>
  <section class="panelbox"><div class="sec-h"><h3>Set</h3><span class="count">${have}/6</span></div><div class="evset">${cards.map(c=>`<img class="${S.cards[c.id]?'got':''}" src="${ART[c.id]}" alt="${c.n}" title="${c.n} · ${RAR[c.r]}">`).join('')}</div></section></aside></div>`;
  return h;
}
function sheetEvStage(k){
  const E=ev(), st=evStages(E)[k]; if(!st) return; const got=E.st[k]||0, open=evOpen(E,k), d=evDeck(st), uniq={}; d.forEach(c=>uniq[c.id]=(uniq[c.id]||0)+1);
  openSheet(`<p class="eyebrow">${SETS[E.set].n} · ${EV_AREAS[E.set][st.a]}</p><div class="sec-h"><h2>${st.n}</h2>${starsHTML(got)}</div>
  <ul class="kv"><li><span>Gegner</span><b>${st.size} Karten · Level ${st.lvl} · Held ${st.hp} Leben</b></li><li><span>Belohnung pro neuem Stern</span><b><img src="${medal(st.tier)}" alt="" width="16" height="16"> 1 ${EV_TN[st.tier]}punkt</b></li></ul>
  <h3>Gegnerisches Deck</h3><div class="grid g4">${Object.keys(uniq).map(c=>`<div class="tile">${cardHTML({id:c,lvl:st.lvl,star:st.star})}${uniq[c]>1?`<span class="flag">×${uniq[c]}</span>`:''}</div>`).join('')}</div>
  <div class="row-btns"><button class="btn" data-act="close">Zurück</button><button class="btn primary" data-act="evFight" data-id="${k}" ${open?'':'disabled'}>${open?'Kampf beginnen':'Noch gesperrt'}</button></div>`);
}
function startEv(k){ const E=ev(), st=evStages(E)[k]; if(!st||!evOpen(E,k)) return; startBattle({mode:'event',stage:st,day:E.day,title:`${SETS[E.set].n} · ${st.n}`,opp:st.n}); }
function evChest(t){
  const E=ev(), C=EV_CHEST[t]; if(!C||E.pts[t]<C.cost) return; E.pts[t]-=C.cost;
  const res=openChest(C.t,0,{ev:1}), r=pick(C.ev), pool=BASE.filter(c=>c.set===E.set&&c.r===r), id=weighted(pool).id;
  if(!S.stat.best||CARD[id].r>CARD[S.stat.best].r) S.stat.best=id;
  res.cards.unshift(Object.assign({t:'kreatur',mult:1},grant(id,!!SKINS[id]&&Math.random()<.06)));
  if(C.bonus){ const n=rnd2(...C.bonus[1]); E.pts[C.bonus[0]]+=n; res.cards.push({t:'punkte',tier:C.bonus[0],n}); }
  res.name=C.n; persist(); render(); revealChests([{t:'',res}],()=>render());
}
Object.assign(ACT,{
  evStage(k){ sfx('tap'); sheetEvStage(+k); },
  evFight(k){ startEv(+k); },
  evGo(a){ evArea=+a; sfx('flip'); render(); },
  evChest(t){ evChest(+t); }
});

/* ====== Hauptmenü, neues Spiel mit Name und Kartenbinder(in) ====== */
let menuOn=false, menuStep='main', NG={name:'',sex:''};
function hasProgress(){ return !!(S.seen.intro||S.stat.fights||Object.keys(S.stars).length); }
function menuSparks(){ let h=''; for(let i=0;i<14;i++){ const r=hash('sp'+i); h+=`<i class="m-spark" style="left:${(r%1000)/10}%;--dx:${(r>>10)%60-30}px;animation-duration:${6+(r>>4)%6}s;animation-delay:${((r>>8)%70)/10}s"></i>`; } return h; }
function renderMenu(){
  const m=$('#menu'); if(!menuOn){ m.hidden=true; m.innerHTML=''; return; }
  m.hidden=false; let h='', mcard='';
  if(menuStep==='main'){
    const go=hasProgress();
    const mc=menuCard(); if(mc) mcard=`<img class="m-card" src="${skinSrc(mc,skinOn(mc))}" alt="${CARD[mc].n}">`; h=`<img class="m-logo" src="bilder/logo.webp" alt="Glutstein"><div class="m-btns">${go?`<button class="btn primary" data-act="menuGo">Weiterspielen</button>`:''}<button class="btn${go?'':' primary'}" data-act="menuNew">Neues Spiel</button><button class="btn" data-act="menuSave">Spielstand</button><button class="btn" data-act="settings">Einstellungen</button></div>`;
  } else if(menuStep==='name'){
    h=`<h2>Wie heißt du?</h2><p class="muted">Bis zu 16 Zeichen. Du kannst ihn später in der Arena ändern.</p><input type="text" id="ngname" maxlength="16" value="${esc(NG.name)}" autocomplete="off" placeholder="Dein Name" enterkeyhint="next"><div class="m-row"><button class="btn" data-act="menuBack">Zurück</button><button class="btn primary" data-act="menuName">Weiter</button></div>`;
  } else {
    h=`<h2>Wer bist du?</h2><div class="m-pick">${[['m','sammler','Kartenbinder'],['w','sammlerin','Kartenbinderin']].map(([x,k,n])=>`<button class="${NG.sex===x?'act':''}" data-act="menuSex" data-id="${x}">${heroImg(k)}${n}</button>`).join('')}</div><div class="m-row"><button class="btn" data-act="menuBack">Zurück</button><button class="btn primary" data-act="menuStart" ${NG.sex?'':'disabled'}>Los geht's</button></div>`;
  }
  m.innerHTML=menuSparks()+mcard+`<div class="m-in">${h}</div>`;
  if(menuStep==='name') setTimeout(()=>{ const i=$('#ngname'); if(i){ i.focus(); i.onkeydown=e=>{ if(e.key==='Enter') ACT.menuName(); }; } },50);
}
function menuCard(){ const own=Object.keys(S.cards).filter(id=>CARD[id]); if(!own.length) return null; const top=Math.max(...own.map(id=>CARD[id].r)), pool=own.filter(id=>CARD[id].r>=Math.min(top,2)); return pool[Math.floor(Math.random()*pool.length)]; }
function openMenu(){ closeSheet(); menuOn=true; menuStep='main'; renderMenu(); music('menue'); }
function hideMenu(){ menuOn=false; renderMenu(); render(); music(tabMusic()); }
function sheetSave(){
  openSheet(`<div class="sec-h"><h2>Spielstand</h2><button class="btn" data-act="close">Schließen</button></div><p class="muted">Dein Spielstand liegt in diesem Browser. Mit dem Code sicherst du ihn oder nimmst ihn auf ein anderes Gerät mit.</p>
  <label class="lbl" for="savecode">Spielstand-Code</label><textarea id="savecode" rows="3" spellcheck="false" autocomplete="off"></textarea>
  <div class="row-btns"><button class="btn" data-act="export">Code erzeugen</button><button class="btn" data-act="import">Code laden</button></div>`);
}
Object.assign(ACT,{
  menuGo(){ hideMenu(); },
  menuNew(){ NG={name:'',sex:''};
    if(!hasProgress()){ menuStep='name'; renderMenu(); return; }
    openSheet(`<h2>Neues Spiel starten?</h2><p class="muted">Dein bisheriger Spielstand mit Karten, Sternen, Gold und Glutsteinen wird überschrieben. Sichere ihn vorher, wenn du ihn behalten willst.</p><div class="row-btns"><button class="btn" data-act="close">Abbrechen</button><button class="btn" data-act="menuSave">Erst sichern</button><button class="btn danger" data-act="menuNewYes">Neu anfangen</button></div>`); },
  menuNewYes(){ closeSheet(); menuStep='name'; renderMenu(); },
  menuSave(){ sheetSave(); },
  menuBack(){ if(menuStep==='held'){ menuStep='name'; } else menuStep='main'; renderMenu(); },
  menuName(){ const i=$('#ngname'), v=i?i.value.trim().slice(0,16):''; if(!v){ toast('Bitte gib einen Namen ein.'); return; } NG.name=v; menuStep='held'; renderMenu(); sfx('tap'); },
  menuSex(x){ NG.sex=x==='w'?'w':'m'; renderMenu(); sfx('tap'); },
  menuStart(){ if(!NG.sex||!NG.name) return; S=Object.assign(fresh(),{vol:S.vol,muted:S.muted,speed:S.speed,name:NG.name,sex:NG.sex,hero:NG.sex==='w'?'sammlerin':'sammler'}); persist(); applyTheme(); tab='map'; mapArea=null; hideMenu(); },
  menuOpen(){ openMenu(); }
});
document.addEventListener('click',e=>{ const el=e.target.closest('[data-act]'); if(!el||el.disabled) return; const f=ACT[el.dataset.act]; f&&f(el.dataset.id,el); });
document.addEventListener('input',e=>{ const k=e.target.dataset&&e.target.dataset.vol; if(!k) return; S.vol[k]=e.target.value/100; const v=$('#vol'+k+'-v'); if(v) v.textContent=e.target.value; applyVol(); persist(); });
document.addEventListener('pointerdown',e=>{
  if(!B) return; const el=e.target.closest('[data-info]'); if(!el) return;
  const [s,i]=el.dataset.info.split(':'), c=i==='pile'?B[s].pile[0]:B[s].lanes[+i];
  if(c){ infoCard=c; const p=$('#b-info'); if(p) p.innerHTML=infoText(); clearTimeout(infoT); infoT=setTimeout(()=>{ infoCard=null; const q=$('#b-info'); if(q) q.innerHTML=infoText(); },3000); }
});
/* Tastatur am PC: Leertaste/Enter = Weiter, Esc = Schließen oder Überspringen, F11 = Vollbild. */
function keyTarget(){
  const vis=sel=>{ const el=document.querySelector(sel); return el&&el.offsetParent!==null&&!el.disabled?el:null; };
  if(!$('#seq').hidden) return $('#seq');
  if(!$('#bossin').hidden) return $('#bossin');
  return vis('#b-tip [data-act=tipOk]')||vis('#sheet [data-act=lootFlip]')||vis('#sheet [data-act=lootNext]')||vis('#sheet [data-act=lootNextChest]')||vis('#sheet [data-act=lootDone]')
    ||vis('#sheet .panel .btn.primary')||vis('#b-result .btn.primary')||(menuOn?vis('#menu .btn.primary'):null);
}
document.addEventListener('keydown',e=>{
  const typing=/^(INPUT|TEXTAREA)$/.test((e.target&&e.target.tagName)||'');
  if(e.key==='F11'){ e.preventDefault(); try{ document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(); }catch(x){} return; }
  if(e.key==='Escape'){
    if(!$('#seq').hidden){ ACT.seqSkip(); return; }
    if(!$('#bossin').hidden){ ACT.bossSkip(); return; }
    if(!$('#sheet').hidden&&!$('#sheet').dataset.modal) closeSheet();
    return;
  }
  if(typing||e.repeat) return;
  if(e.key===' '||e.key==='Enter'){ const t=keyTarget(); if(t){ e.preventDefault(); t.click(); } }
});

function start(data){
  S=data&&data.save?sane(data.save):load(); tab=(data&&data.tab)||'map'; menuOn=!(data&&data.tab); wantLoop=tabMusic();
  applyTheme(); render(); persist(); renderMenu();
}
/* Web-App: Offline-Speicher anmelden (nur auf der eigenen Seite, nicht eingebettet). Neue Version: Hinweis zum Neuladen, damit kein Kampf abbricht. */
if('serviceWorker' in navigator&&window.top===window&&/^https?:$/.test(location.protocol)&&!/claude/.test(location.hostname)){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!had||document.querySelector('.newver')) return; const b=document.createElement('button'); b.className='newver'; b.textContent='Neue Version vorhanden · Tippen zum Laden'; b.onclick=()=>location.reload(); document.body.appendChild(b); });
}
window.claude?.hot?.snapshot?.(()=>({save:S,tab}));
if(window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data??{});
