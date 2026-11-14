/*ENGINE-START*/
/* ====== Spielregeln und Daten. Dieser Block kennt kein DOM und lässt sich einzeln testen. ====== */
const P_HP=2000, MAXLVL=25, MAXSTAR=5, DECK_MIN=3, DECK_MAX=8, LANES=3, FATIGUE_FROM=15, FATIGUE_DMG=150;
const STAR_PCT=.25, LVL_PCT=.04;
/* Grundbudget je Seltenheit, Wachstum pro Level je Seltenheit, Sterne ab denen Fähigkeiten wirken. */
const RAR_BASE=[600,680,760,840], LVL_PCT_R=[.03,.04,.05,.06], KW_STAR=[5,3,1,1];
function hashS(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
/* Kategorien (Elemente): Wasser schlägt Feuer, Feuer schlägt Erde, Erde schlägt Wasser, Licht und Schatten schlagen sich gegenseitig. */
const CATS={feuer:'Feuer',wasser:'Wasser',erde:'Erde',schatten:'Schatten',licht:'Licht'};
const STRONG={wasser:'feuer',feuer:'erde',erde:'wasser',licht:'schatten',schatten:'licht'};
const WEAKTO={feuer:'wasser',erde:'feuer',wasser:'erde',schatten:'licht',licht:'schatten'};
const STRONG_MULT=1.5;
/* Sets: benannte Kartengruppen innerhalb einer Kategorie. Neue Sets = Erweiterungen. */
const SETS={
  glut:{n:'Glut',l:'G',cat:'feuer'},
  flut:{n:'Flut',l:'F',cat:'wasser'},
  hain:{n:'Hain',l:'H',cat:'erde'},
  nacht:{n:'Nacht',l:'N',cat:'schatten'},
  sonne:{n:'Sonne',l:'S',cat:'licht'},
  /* Freie Sets: gehören zu keinem Gebiet, kommen nur aus Truhen und mischen zwei Kategorien. */
  abyss:{n:'Abyssal',l:'A',cat:'wasser',cats:['wasser','schatten'],col:'#2b7f9e',free:1},
  schmiede:{n:'Sonnenschmiede',l:'Z',cat:'feuer',cats:['feuer','licht'],col:'#c46a22',free:1},
  mangrove:{n:'Mangrovenküste',l:'M',cat:'erde',cats:['erde','wasser'],col:'#4f8a4a',free:1},
  daemmerung:{n:'Dämmerung',l:'D',cat:'schatten',cats:['schatten','licht'],col:'#8a5aa8',free:1},
  totenwald:{n:'Totenwald',l:'T',cat:'schatten',cats:['schatten','erde'],col:'#5d6b3a',free:1},
  kristall:{n:'Kristallsee',l:'K',cat:'licht',cats:['licht','wasser'],col:'#3fa3b8',free:1},
  erwachen:{n:'Das Erwachen',l:'E',cat:'feuer',cats:['feuer','schatten'],col:'#9a3a6a',free:1},
  luft:{n:'Luftpiraten',l:'L',cat:'licht',cats:['licht','feuer'],col:'#b8902a',free:1},
  raeder:{n:'Räderwerk',l:'R',cat:'erde',cats:['erde','feuer'],col:'#8a6a3a',free:1}
};
Object.values(SETS).forEach(x=>{ if(!x.cats) x.cats=[x.cat]; });
/* Setbonus ab 3 verschiedenen Karten eines Sets im Deck, großer Bonus ab 6. */
const SET_BONUS={
  glut:['Glut-Karten +5 % Angriff','zusätzlich Einschlag +50 %'],
  flut:['Held +20 % Leben','Flut-Karten Schild +15 %'],
  hain:['Hain-Karten +10 % Angriff und Leben','zusätzlich Heilung +8 %'],
  nacht:['Nacht-Karten Rache +40 %, +10 % Angriff und Leben','zusätzlich +10 % Angriff und Leben'],
  sonne:['Sonne-Karten Heilung +8 %, +10 % Angriff und Leben','Held heilt 5 % pro Runde, Sonne-Karten +10 % Angriff'],
  abyss:['Abyssal-Karten +10 % Angriff und Leben','zusätzlich heilen sie sich um 5 % pro Runde'],
  schmiede:['Schmiede-Karten erleiden 5 % weniger Schaden','zusätzlich +25 % Angriff in der ersten Runde'],
  mangrove:['Mangroven-Karten +10 % Angriff und Leben','zusätzlich +5 % Angriff in jeder weiteren Runde auf dem Feld'],
  daemmerung:['Dämmerungs-Karten +10 % Angriff und Leben','ihr Elementvorteil steigt auf +75 %'],
  totenwald:['Gegnerische Karten verlieren pro Runde 4 % Leben','die erste eigene Karte, die fällt, kehrt einmal mit 40 % Leben zurück'],
  kristall:['Kristallsee-Karten +10 % Angriff und Leben, in der ersten Runde 20 % weniger Schaden','am Rundenbeginn heilt die schwächste eigene Karte um 15 %'],
  erwachen:['Gegnerische Karten machen in der ersten Runde 15 % weniger Schaden','fällt eine Erwachen-Karte, nimmt die Karte gegenüber 20 % ihrer Lebenspunkte Schaden'],
  luft:['Luftpiraten +10 % Angriff und Leben, Flug trifft Helden mit 50 % mehr Schaden','zusätzlich +10 % Angriff und 20 % weniger Schaden in der ersten Runde'],
  raeder:['Räderwerk-Karten +10 % Angriff und Leben','zusätzlich reparieren sie sich um 4 % pro Runde']
};
/* Setboni als Daten. Stufe 1 ab 3 Karten, Stufe 2 ab 6 (zusätzlich). Kartenwerte gelten für Karten des Sets, Seitenwerte für die ganze Seite. */
const SET_FX={
  glut:[{atk:.05},{kw:{einschlag:1}}], flut:[{heroHp:.2},{kw:{schild:1}}], hain:[{hp:.1,atk:.1},{kw:{heilung:1}}],
  nacht:[{kw:{rache:1},atk:.1,hp:.1},{atk:.1,hp:.1}], sonne:[{kw:{heilung:1},hp:.1,atk:.1},{heroRegen:.05,atk:.1}],
  abyss:[{hp:.1,atk:.1},{kw:{heilung:5/8}}], schmiede:[{kw:{schild:1/3}},{atk1:.25}], mangrove:[{atk:.1,hp:.1},{grow:.05}],
  daemmerung:[{atk:.1,hp:.1},{elem:1.75}], totenwald:[{curse:.04},{revive:.4}], kristall:[{dr1:.2,hp:.1,atk:.1},{mend:.15}],
  erwachen:[{fear:.15},{scare:.2}], luft:[{flyHero:.5,hp:.1,atk:.1},{dr1:.2,atk:.1}], raeder:[{hp:.1,atk:.1},{kw:{heilung:.5}}]
};
const SIDE_FX=['heroHp','heroRegen','curse','revive','mend','fear'];
const RAR=['Bronze','Silber','Gold','Diamant'], RAR_DESC=['gewöhnlich','ungewöhnlich','selten','sehr selten'];
/* Schlüsselwörter in Punkten. Ein Punkt entspricht: Schild 15 % weniger Schaden, Einschlag 50 % des Angriffs, Heilung 8 % der Lebenspunkte,
   Segen 6 % für alle eigenen Karten, Rache 40 % des Angriffs auf den Helden. */
const KWP={schild:15,einschlag:50,heilung:8,segen:6,rache:40};
const KW={
  schild:{n:'Schild',v:1,d:v=>`Erleidet pro Treffer ${Math.round(v*15)} % weniger Schaden.`},
  durchbruch:{n:'Durchbruch',d:()=>'Überschüssiger Schaden trifft den gegnerischen Helden.'},
  flug:{n:'Flug',d:()=>'Fliegt über die Karte gegenüber und trifft den Helden mit 50 % ihres Angriffs, solange gegenüber kein Flieger steht.'},
  heilung:{n:'Heilung',v:1,d:v=>`Heilt sich zu Rundenbeginn um ${Math.round(v*8)} % ihrer Lebenspunkte.`},
  segen:{n:'Segen',v:1,d:v=>`Heilt zu Rundenbeginn alle eigenen Karten um ${v*6} % ihrer Lebenspunkte.`},
  wut:{n:'Wut',d:()=>'Erhält +10 % Angriff, wenn sie einen Treffer überlebt.'},
  rache:{n:'Rache',v:1,d:v=>`Fügt beim Tod dem gegnerischen Helden ${v*40} % ihres Angriffs zu.`},
  einschlag:{n:'Einschlag',v:1,d:v=>`Einmalig in der ersten Runde: ${v*50} % ihres Angriffs als Schaden an der Karte gegenüber.`},
  anfuehrer:{n:'Anführer',d:()=>'Einmalig in der ersten Runde: Nachbarkarten erhalten +15 % Angriff.'}
};
function kwVal(k,v){ return KWP[k]?Math.round(v*KWP[k])+' %':''; }
/* id, Name, Set, Seltenheit 0–3 (Bronze, Silber, Gold, Diamant), Angriff, Leben, Schlüsselwörter. Je Set: 2 Bronze, 2 Silber, 1 Gold, 1 Diamant. */
const BASE=[
 ['funkenwicht','Funkenwicht','glut',0,3,3,{}],
 ['glutwolf','Glutwolf','glut',0,3,3,{durchbruch:1}],
 ['brandbogner','Brandbogner','glut',1,3,4,{einschlag:2}],
 ['flammenhexe','Flammenhexe','glut',1,4,4,{einschlag:2}],
 ['schlackenriese','Schlackenriese','glut',2,4,8,{wut:1}],
 ['aschendrache','Aschendrache','glut',3,5,7,{flug:1,einschlag:2}],
 ['tuempelgeist','Tümpelgeist','flut',0,2,4,{heilung:1}],
 ['gezeitenwache','Gezeitenwache','flut',0,2,4,{schild:1}],
 ['perlentaucherin','Perlentaucherin','flut',1,4,5,{}],
 ['nebelheilerin','Nebelheilerin','flut',1,3,5,{segen:1}],
 ['sturmrufer','Sturmrufer','flut',2,5,6,{einschlag:2}],
 ['leviathan','Leviathan','flut',3,6,9,{schild:1}],
 ['moosling','Moosling','hain',0,2,5,{}],
 ['dornenhirsch','Dornenhirsch','hain',0,3,3,{wut:1}],
 ['wurzelhueter','Wurzelhüter','hain',1,2,7,{schild:1}],
 ['rudelfuehrerin','Rudelführerin','hain',1,4,4,{anfuehrer:1}],
 ['alteiche','Alteiche','hain',2,4,9,{heilung:2}],
 ['waldkoenigin','Waldkönigin','hain',3,5,8,{anfuehrer:1,segen:1}],
 ['nachtfalter','Nachtfalter','nacht',0,1,3,{flug:1}],
 ['grabkriecher','Grabkriecher','nacht',0,3,3,{rache:1}],
 ['schattendolch','Schattendolch','nacht',1,5,3,{}],
 ['kraehenschwarm','Krähenschwarm','nacht',1,2,5,{flug:1}],
 ['seelenhaendlerin','Seelenhändlerin','nacht',2,5,7,{rache:2}],
 ['mitternachtsfuerstin','Mitternachtsfürstin','nacht',3,4,8,{flug:1,rache:2}],
 ['irrlicht','Irrlicht','sonne',0,1,4,{flug:1}],
 ['sonneneinhorn','Sonneneinhorn','sonne',0,2,4,{heilung:1}],
 ['lichtritter','Lichtritter','sonne',1,3,5,{schild:1}],
 ['sonnenloewe','Sonnenlöwe','sonne',1,5,5,{durchbruch:1}],
 ['lichtmagier','Lichtmagier','sonne',2,5,7,{einschlag:3}],
 ['seraphin','Seraphin','sonne',3,4,9,{flug:1,segen:2}],
 ['laternenfisch','Laternenfisch','abyss',0,3,3,{einschlag:1},'wasser'],
 ['geisterqualle','Geisterqualle','abyss',0,2,4,{heilung:1},'wasser'],
 ['muraenenwaechter','Muränenwächter','abyss',1,5,4,{durchbruch:1},'wasser'],
 ['matrose','Ertrunkener Matrose','abyss',1,3,5,{rache:1},'schatten'],
 ['tiefenkrake','Tiefenkrake','abyss',2,5,8,{einschlag:2},'wasser'],
 ['abgrundkoenigin','Abgrundkönigin','abyss',3,5,8,{segen:1,rache:1},'schatten'],
 ['essenlehrling','Essenlehrling','schmiede',0,3,3,{wut:1},'feuer'],
 ['schlackengolem','Schlackengolem','schmiede',0,2,5,{schild:1},'feuer'],
 ['lavaschuerfer','Lavaschürfer','schmiede',1,4,4,{durchbruch:1},'feuer'],
 ['runenschmiedin','Runenschmiedin','schmiede',1,3,5,{anfuehrer:1},'licht'],
 ['magmagolem','Magmagolem','schmiede',2,4,9,{schild:1},'feuer'],
 ['sonnenschmied','Der Sonnenschmied','schmiede',3,5,8,{einschlag:2,anfuehrer:1},'licht'],
 ['wurzelkrabbe','Wurzelkrabbe','mangrove',0,2,5,{schild:1},'erde'],
 ['einbaumfischer','Einbaumfischer','mangrove',0,3,3,{einschlag:1},'wasser'],
 ['schlammkrokodil','Schlammkrokodil','mangrove',1,5,4,{durchbruch:1},'erde'],
 ['panzerschildkroete','Panzerschildkröte','mangrove',1,2,7,{schild:1,heilung:1},'erde'],
 ['gezeitenschamanin','Gezeitenschamanin','mangrove',2,4,6,{segen:1},'wasser'],
 ['mangrovenriese','Mangrovenriese','mangrove',3,5,9,{wut:1,heilung:1},'erde'],
 ['daemmerkatze','Dämmerkatze','daemmerung',0,3,3,{rache:1},'schatten'],
 ['morgenfalke','Morgenfalke','daemmerung',0,2,3,{flug:1},'licht'],
 ['mondpriesterin','Mondpriesterin','daemmerung',1,3,5,{segen:1},'schatten'],
 ['vampirjaegerin','Vampirjägerin','daemmerung',1,5,4,{durchbruch:1},'licht'],
 ['gefallenerengel','Gefallener Engel','daemmerung',2,5,6,{flug:1},'schatten'],
 ['eklipsenwaechter','Eklipsenwächter','daemmerung',3,5,8,{einschlag:2,schild:1},'licht'],
 ['ghul','Ghul','totenwald',0,3,3,{wut:1},'schatten'],
 ['giftpilzling','Giftpilzling','totenwald',0,2,4,{rache:1},'erde'],
 ['nekromant','Nekromant','totenwald',1,3,5,{segen:1},'schatten'],
 ['wuergewurzel','Würgewurzel','totenwald',1,3,6,{schild:1},'erde'],
 ['knochenhirsch','Knochenhirsch','totenwald',2,5,6,{durchbruch:1},'schatten'],
 ['totenherrin','Herrin des Totenwalds','totenwald',3,5,8,{rache:2,segen:1},'schatten'],
 ['lichtlibelle','Lichtlibelle','kristall',0,2,3,{flug:1},'licht'],
 ['kristallkarpfen','Kristallkarpfen','kristall',0,2,5,{schild:1},'wasser'],
 ['schwanenritter','Schwanenritter','kristall',1,3,6,{schild:1},'licht'],
 ['lichtelfe','Lichtelfe','kristall',1,4,4,{flug:1},'licht'],
 ['seenixe','Seenixe','kristall',2,4,7,{heilung:2},'wasser'],
 ['seeherrin','Die Herrin vom See','kristall',3,5,8,{einschlag:2,segen:1},'licht'],
 ['flammenkultistin','Flammenkultistin','erwachen',0,3,3,{einschlag:1},'feuer'],
 ['tentakelbrut','Tentakelbrut','erwachen',0,3,4,{wut:1},'schatten'],
 ['gesichtsloser','Der Gesichtslose','erwachen',1,4,4,{anfuehrer:1},'feuer'],
 ['glutaugen','Glutaugen','erwachen',1,4,3,{flug:1},'feuer'],
 ['brunnending','Das Ding im Brunnen','erwachen',2,4,8,{rache:2},'schatten'],
 ['erwachter','Der Erwachte','erwachen',3,6,8,{einschlag:2,durchbruch:1},'feuer'],
 ['flugschuelerin','Flugschülerin','luft',0,2,3,{flug:1},'licht'],
 ['raketenkobold','Raketenkobold','luft',0,4,2,{einschlag:1},'feuer'],
 ['wolkenkurier','Wolkenkurier','luft',1,3,5,{segen:1},'licht'],
 ['fliegerass','Fliegerass','luft',1,4,4,{flug:1},'licht'],
 ['glutfalke','Glutfalke','luft',2,5,6,{einschlag:2,durchbruch:1},'feuer'],
 ['himmelsschiff','Das Himmelsschiff','luft',3,5,9,{flug:1,schild:1},'licht'],
 ['zahnradkaefer','Zahnradkäfer','raeder',0,2,5,{schild:1},'erde'],
 ['kesselflicker','Kesselflicker','raeder',0,3,3,{wut:1},'feuer'],
 ['uhrwerkhund','Uhrwerkhund','raeder',1,4,4,{wut:1},'erde'],
 ['erfinderin','Erfinderin','raeder',1,3,5,{segen:1},'erde'],
 ['dampfritter','Dampfritter','raeder',2,5,7,{schild:1},'feuer'],
 ['messingkoloss','Der Messingkoloss','raeder',3,5,10,{schild:2},'erde']
].map(([id,n,set,r,a0,h0,k,cat])=>{
  /* Grundwerte je Seltenheit liegen eng beieinander. Jede Karte hat ihr eigenes Verhältnis von Angriff zu Leben (30–70 %). */
  const x=hashS(id), u=(x%1000)/1000, T=Math.round(RAR_BASE[r]*(1+((x>>10)%7-3)/100)/10)*10;
  const share=Math.min(.7,Math.max(.3,.45*a0/(a0+h0)+.55*(.3+.4*u))), a=Math.round(T*share/10)*10, h=T-a;
  return {id,n,set,cat:cat||SETS[set].cat,r,a,h,k};
});
/* Fähigkeiten wachsen mit: Bronze erst mit 5 Sternen, Silber ab 3 Sternen, Gold und Diamant von Anfang an. Vorher stehen sie nicht auf der Karte. */
function kwOf(id,star){ const c=CARD[id]; return (star||1)>=KW_STAR[c.r]?c.k:{}; }
const CARD={}; BASE.forEach(c=>CARD[c.id]=c);
const STARTER=['funkenwicht','tuempelgeist','moosling','irrlicht','nachtfalter'];

/* ====== Kampagne: 5 Gebiete, je eines pro Kategorie, je 8 Gefechte. Gegner nur aus dem Set des Gebiets. ====== */
const AREAS=[
 {set:'glut',n:'I · Der Aschenpfad',s:'Funken, Wölfe und der Schlackenfürst.',img:'kapitel-1',unl:['glutwolf','brandbogner','flammenhexe']},
 {set:'flut',n:'II · Die versunkene Küste',s:'Nebel, Gischt und die Gezeitenmutter.',img:'kapitel-2',unl:['gezeitenwache','perlentaucherin','nebelheilerin']},
 {set:'hain',n:'III · Der Wurzelwald',s:'Moos, Dornen und die älteste Eiche.',img:'kapitel-4',unl:['dornenhirsch','wurzelhueter','rudelfuehrerin']},
 {set:'nacht',n:'IV · Das Hohle Reich',s:'Krähen, Gräber und der Hohle König.',img:'kapitel-3',unl:['grabkriecher','schattendolch','kraehenschwarm']},
 {set:'sonne',n:'V · Die Sonnenwacht',s:'Der Orden des Lichts und sein Erzseraph.',img:'kapitel-5',unl:['sonneneinhorn','lichtritter','sonnenloewe']}
];
/* Kampagne: 16 Gefechte je Gebiet. Die alten 8 Gefechte liegen auf den geraden Plätzen, dazwischen je ein leichteres neues. */
const STAGES_PER=16;
const STAGE_NAMES_OLD=[
 'Funkenplage','Glimmende Hecke','Wolfsrudel','Brandwache am Pass','Rauchende Felder','Schmiede der Asche','Der Glutturm','Schlackenfürst Ormak',
 'Tümpelgeister','Nebelbucht','Die Gezeitenwache','Perlengrund','Das Wrack','Sturmküste','Der Leuchtturm','Gezeitenmutter Ysra',
 'Moosige Senke','Dornendickicht','Die Wurzelbrücke','Hirschpfad','Rudelfelsen','Der Steinkreis','Herz des Waldes','Urborke, die Alteiche',
 'Krähenfeld','Grabhügel','Seelenmarkt','Nachtfalterwald','Schattengasse','Die Knochenbrücke','Die hohle Garde','Der Hohle König',
 'Irrlichtschwarm','Der Sonnenweg','Orden des Lichts','Löwenfelsen','Die Spiegelhalle','Das Himmelstor','Die letzte Wacht','Erzseraph Aurel'
];
const STAGE_NAMES_NEW=[
 'Der Ascheweg','Kohlenbrücke','Funkenschlucht','Die Glutmine','Rußdorf','Lavarinne','Die Brennöfen','Schlackenstufen',
 'Strandgut','Salzklippen','Muschelbank','Flutgräben','Gischtpfad','Seetangwald','Ertrunkene Kapelle','Am Strudelrand',
 'Waldrand','Pilzlichtung','Farnschlucht','Baumhausdorf','Wurzeltunnel','Moorsteg','Die Kristallquelle','Uralte Pforte',
 'Totenacker','Die Vogelscheuchen','Gruft am Hügel','Galgenweg','Nebelsumpf','Ruinenkapelle','Mondschatten','Das Burgtor',
 'Mühlenweg','Der Bergpass','Der Wachturm','Brücke der Banner','Die weiße Kuppel','Brunnen des Lichts','Der Säulengang','Die Tempelstufen'
];
const STAGE_NAMES=[]; for(let a=0;a<5;a++) for(let k=0;k<8;k++){ STAGE_NAMES.push(STAGE_NAMES_NEW[a*8+k],STAGE_NAMES_OLD[a*8+k]); }
const UNLOCK_SLOTS=[3,8,13]; /* Gefecht 4, 9 und 14 eines Gebiets schalten je eine Karte frei. */
/* Werte der alten 8 Gefechte; die neuen Zwischengefechte übernehmen die Werte des vorigen alten Gefechts (leichter). */
const RMAX8=[[0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1],[0,0,1,1,1,2,2,1],[0,0,0,1,1,1,1,1],[0,0,1,1,1,2,2,1]];
const AREA_LVL8=[[1,2,2,3,4,5,5,6],[5,5,6,6,6,6,6,9],[9,9,10,10,9,9,9,9],[12,10,12,11,14,14,15,16],[15,15,16,15,16,15,15,17]];
const AREA_SIZE8=[[3,3,4,4,4,5,5,4],[3,4,4,5,5,5,5,6],[5,6,6,7,7,8,7,8],[6,6,7,6,8,8,8,6],[4,5,5,6,6,6,6,7]];
const x16=(T,first)=>T.map((r,a)=>r.flatMap((v,k)=>[k?Math.min(r[k-1],v):first(v,a),v]));
const RMAX=x16(RMAX8,v=>v), AREA_LVL=x16(AREA_LVL8,(v,a)=>a?AREA_LVL8[a-1][7]-1:v), AREA_SIZE=x16(AREA_SIZE8,v=>Math.max(3,v-1));
const STAGES=STAGE_NAMES.map((n,k)=>{
  const a=Math.floor(k/STAGES_PER), i=k%STAGES_PER, boss=i===STAGES_PER-1, A=AREAS[a], u=UNLOCK_SLOTS.indexOf(i), lvl=AREA_LVL[a][i];
  return {id:k+1,area:a,i,n,boss,set:A.set,cat:SETS[A.set].cat,unlock:u>=0?A.unl[u]:'',weak:k<2,
    size:AREA_SIZE[a][i], rmax:RMAX[a][i], top:boss?(a===0||a===3?2:3):-1,
    lvl, star:Math.min(MAXSTAR,Math.ceil(lvl/5)), hp:Math.round((800+i*30+(boss?400:0))*mult(Math.min(MAXSTAR,Math.ceil(lvl/5)),lvl)/10)*10,
    gold:boss?150+a*75:40+a*20+Math.round(i*2.5)};
});
const BOSS_ID=a=>(a+1)*STAGES_PER, LAST_ID=AREAS.length*STAGES_PER;
function rng(seed){ return ()=>{ seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
/* Gegnerdeck eines Gefechts: nur Karten aus dem Set des Gebiets, Doppelte erlaubt (PvE). Heroisch: +8 Level. */
function stageDeck(st,hero){
  const r=rng(hash('g'+st.id)), pool=BASE.filter(c=>c.set===st.set&&c.r<=st.rmax), ids=[];
  if(st.top>=0){ const top=BASE.find(c=>c.set===st.set&&c.r===st.top); ids.push(top.id); }
  while(ids.length<st.size){ const w=pool.map(c=>c.r===st.rmax?2:1), sum=w.reduce((a,b)=>a+b,0); let v=r()*sum, i=0; while(v>w[i]&&i<w.length-1){ v-=w[i]; i++; } ids.push(pool[i].id); }
  const lvl=Math.min(MAXLVL,st.lvl+(hero?8:0)), star=Math.min(MAXSTAR,Math.ceil(lvl/5));
  return ids.map(id=>({id,lvl,star,weak:st.weak&&!hero}));
}
function stageHp(st,hero){ return hero?Math.round(st.hp*2/10)*10:st.hp; }

const LEAGUES=[{n:'Aschenliga',lo:0},{n:'Kupferliga',lo:150},{n:'Silberliga',lo:400},{n:'Goldliga',lo:750},{n:'Glutliga',lo:1200}];
function leagueOf(t){ let i=0; LEAGUES.forEach((L,k)=>{ if(t>=L.lo) i=k; }); return i; }
/* Stärke: +25 % pro Stern über dem ersten, +4 % pro Level über dem ersten. */
function mult(star,lvl,r){ return 1+STAR_PCT*((star||1)-1)+(r==null?LVL_PCT:LVL_PCT_R[r])*((lvl||1)-1); }
function stats(id,lvl,star){ const c=CARD[id], m=mult(star,lvl,c.r); return {a:Math.round(c.a*m),h:Math.round(c.h*m)}; }
function strongVs(att,def){ return !!att&&!!def&&STRONG[att.cat]===def.cat; }
function strongMult(att){ return (att&&att.fx&&att.fx.elem)||STRONG_MULT; }
function boosted(att,def,d){ return strongVs(att,def)?Math.ceil(d*strongMult(att)):d; }
function stPct(att,def){ return strongVs(att,def)?Math.round(strongMult(att)*100-100):0; }
function setLevels(deck){ const seen={}; deck.forEach(c=>{ const s=CARD[c.id].set; (seen[s]=seen[s]||new Set()).add(c.id); }); const out={}; for(const s in seen){ const n=seen[s].size; out[s]=n>=6?2:n>=3?1:0; } return out; }
function setCounts(ids){ const seen={}; ids.forEach(id=>{ const s=CARD[id].set; (seen[s]=seen[s]||new Set()).add(id); }); const out={}; for(const s in seen) out[s]=seen[s].size; return out; }
let UID=1;
function fxOf(set,lv){ const out={}; (SET_FX[set]||[]).slice(0,lv).forEach(f=>{ for(const x in f){ if(x==='kw'){ out.kw=out.kw||{}; for(const y in f.kw) out.kw[y]=(out.kw[y]||0)+f.kw[y]; } else out[x]=(out[x]||0)+f[x]; } }); return out; }
function inst(d,bon){
  const c=CARD[d.id], s=stats(d.id,d.lvl||1,d.star||1), k=Object.assign({},kwOf(d.id,d.star)), f=fxOf(c.set,bon[c.set]||0), fx={};
  let a=s.a, h=s.h;
  if(d.weak){ a=Math.round(a*.7); h=Math.round(h*.7); }
  if(f.atk) a=Math.round(a*(1+f.atk)); if(f.hp) h=Math.round(h*(1+f.hp));
  if(f.kw) for(const y in f.kw) k[y]=(k[y]||0)+f.kw[y];
  ['atk1','elem','flyHero','dr1','grow','scare'].forEach(x=>{ if(f[x]) fx[x]=f[x]; });
  return {uid:UID++,id:d.id,set:c.set,cat:c.cat,lvl:d.lvl||1,star:d.star||1,a,a0:a,h,mh:h,k,fx,fresh:true,skin:d.skin||0};
}
function shuffle(a,rnd){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const other=s=>s==='p'?'e':'p';
function mkSide(hp,deck,rnd){
  const bon=setLevels(deck), sf={}; for(const x in bon){ const f=fxOf(x,bon[x]); SIDE_FX.forEach(y=>{ if(f[y]) sf[y]=Math.max(sf[y]||0,f[y]); }); }
  const hpx=Math.round(hp*(1+(sf.heroHp||0)));
  return {hp:hpx,maxHp:hpx,regen:Math.round(hpx*(sf.heroRegen||0)),curse:sf.curse||0,revive:sf.revive||0,revUsed:false,mend:sf.mend||0,fear:sf.fear||0,bon,pile:shuffle(deck.map(d=>inst(d,bon)),rnd),lanes:[null,null,null],lost:0};
}
/* Schaden einer angreifenden Karte in Runde 1: eigener Schmiede-Bonus, gegnerisches Grauen. */
function outMult(B,s,c){ if(B.round!==1) return 1; return (1+((c.fx&&c.fx.atk1)||0))*(1-(B[other(s)].fear||0)); }
function heroHp(deck){ const n=deck.length||1, st=deck.reduce((x,d)=>x+(d.star||1),0)/n, lv=deck.reduce((x,d)=>x+(d.lvl||1),0)/n; return Math.round(P_HP*mult(st,lv)/10)*10; }
function newBattle(pDeck,oppDeck,oppHp,rnd){
  rnd=rnd||Math.random;
  /* Das Heldenleben wächst mit dem Deck (Durchschnitt aus Sternen und Level), sonst würden Flug und Rache auf hohem Level alles entscheiden. Ohne Angabe gilt das auch für den Gegner. */
  const B={round:0,over:null,rnd,p:mkSide(heroHp(pDeck),pDeck,rnd),e:mkSide(oppHp||heroHp(oppDeck),oppDeck,rnd)};
  for(let l=0;l<LANES;l++){ refill(B,'p',l,[]); refill(B,'e',l,[]); }
  return B;
}
function refill(B,s,l,ev){ const S=B[s]; if(S.lanes[l]||!S.pile.length) return; const c=S.pile.shift(); c.fresh=true; S.lanes[l]=c; ev.push({t:'enter',s,l,n:CARD[c.id].n}); }
function alive(S){ return S.lanes.some(Boolean)||S.pile.length>0; }
function checkOver(B,ev){
  if(B.over) return; const pd=B.p.hp<=0||!alive(B.p), ed=B.e.hp<=0||!alive(B.e);
  if(pd||ed){ B.over=ed&&!pd?'p':'e'; ev.push({t:'over',w:B.over}); }
}
function hurtHero(B,s,d,ev,why,by,l){ d=Math.round(d); if(d<=0||B.over) return; const S=B[s]; S.hp=Math.max(0,S.hp-d); ev.push({t:'hero',s,d,why,by,l}); }
function dmgCard(B,s,l,d,ev,st,by){
  const c=B[s].lanes[l]; if(!c) return {over:0,dead:false};
  if(B.round===1&&c.fx&&c.fx.dr1) d*=1-c.fx.dr1;
  const dmg=Math.max(0,Math.round(d*(1-Math.min(.75,(c.k.schild||0)*KWP.schild/100)))), over=Math.max(0,dmg-Math.max(0,c.h));
  c.h-=dmg; ev.push({t:'hit',s,l,d:dmg,st:st||0,n:CARD[c.id].n,by});
  return {over,dead:c.h<=0};
}
function killDead(B,ev){
  for(let pass=0;pass<4;pass++){ let any=false;
  ['p','e'].forEach(s=>{ const S=B[s]; for(let l=0;l<LANES;l++){ const c=S.lanes[l]; if(c&&c.h<=0){
    if(S.revive&&!S.revUsed){ S.revUsed=true; c.h=Math.max(1,Math.round(c.mh*S.revive)); ev.push({t:'revive',s,l,n:CARD[c.id].n,h:c.h}); continue; }
    any=true; S.lanes[l]=null; S.lost++; ev.push({t:'die',s,l,n:CARD[c.id].n}); if(c.k.rache) hurtHero(B,other(s),c.a0*c.k.rache*KWP.rache/100,ev,'rache',CARD[c.id].n);
    const o=B[other(s)].lanes[l]; if(c.fx&&c.fx.scare&&o&&o.h>0){ const d=Math.round(o.mh*c.fx.scare); o.h-=d; ev.push({t:'hit',s:other(s),l,d,st:0,n:CARD[o.id].n,by:'Letzter Schrecken'}); }
  } } });
  if(!any) break; }
  ['p','e'].forEach(s=>{ for(let l=0;l<LANES;l++) refill(B,s,l,ev); });
}
/* Rundenbeginn: Erschöpfung, Heldenheilung, einmalige Fähigkeiten neuer Karten, Heilung und Segen. */
function roundStart(B){
  const ev=[]; if(B.over) return ev; B.round++; ev.push({t:'round',r:B.round});
  if(B.round>=FATIGUE_FROM){ const d=(B.round-FATIGUE_FROM+1)*FATIGUE_DMG; hurtHero(B,'p',d,ev,'fatigue'); hurtHero(B,'e',d,ev,'fatigue'); checkOver(B,ev); if(B.over) return ev; }
  if(B.decay) ['p','e'].forEach(s=>B[s].lanes.forEach((c,l)=>{ if(c&&c.h>0){ const d=Math.max(1,Math.round(c.mh*B.decay)); c.h-=d; ev.push({t:'hit',s,l,d,st:0,n:CARD[c.id].n,by:'Der Zerfall'}); } }));
  ['p','e'].forEach(s=>{ const S=B[s]; if(S.regen&&S.hp<S.maxHp){ const b=S.hp; S.hp=Math.min(S.maxHp,S.hp+S.regen); ev.push({t:'heroheal',s,d:S.hp-b}); } });
  ['p','e'].forEach(s=>{
    const S=B[s], O=B[other(s)];
    for(let l=0;l<LANES;l++){ const c=S.lanes[l]; if(!c||!c.fresh) continue; c.fresh=false;
      if(c.k.einschlag&&O.lanes[l]){ ev.push({t:'skill',s,l,n:CARD[c.id].n,what:'Einschlag'}); dmgCard(B,other(s),l,boosted(c,O.lanes[l],c.a*c.k.einschlag*KWP.einschlag/100*outMult(B,s,c)),ev,stPct(c,O.lanes[l]),CARD[c.id].n); }
      if(c.k.anfuehrer) [l-1,l+1].forEach(j=>{ const n=S.lanes[j]; if(n){ const add=Math.round(n.a0*.15); n.a+=add; ev.push({t:'buff',s,l:j,n:CARD[n.id].n,d:add}); } });
    }
  });
  ['p','e'].forEach(s=>{ const S=B[s], O=B[other(s)];
    if(S.curse) O.lanes.forEach((o,l)=>{ if(o&&o.h>0){ const d=Math.max(1,Math.round(o.mh*S.curse)); o.h-=d; ev.push({t:'hit',s:other(s),l,d,st:0,n:CARD[o.id].n,by:'Der Fluch des Totenwalds'}); } });
    if(B.round>1) S.lanes.forEach((c,l)=>{ if(c&&c.h>0&&c.fx&&c.fx.grow){ const add=Math.max(1,Math.round(c.a0*c.fx.grow)); c.a+=add; ev.push({t:'buff',s,l,n:CARD[c.id].n,d:add,why:'wachsen'}); } });
    if(S.mend){ let w=-1, best=1; S.lanes.forEach((c,l)=>{ if(c&&c.h>0&&c.h/c.mh<best){ best=c.h/c.mh; w=l; } }); if(w>=0){ const c=S.lanes[w], b=c.h; c.h=Math.min(c.mh,c.h+Math.round(c.mh*S.mend)); ev.push({t:'heal',s,l:w,d:c.h-b,n:CARD[c.id].n}); } }
  });
  ['p','e'].forEach(s=>{
    const S=B[s];
    S.lanes.forEach((c,l)=>{ if(!c||c.h<=0) return;
      if(c.k.heilung&&c.h<c.mh){ const b=c.h; c.h=Math.min(c.mh,c.h+Math.round(c.mh*c.k.heilung*KWP.heilung/100)); ev.push({t:'heal',s,l,d:c.h-b,n:CARD[c.id].n}); }
      if(c.k.segen) S.lanes.forEach((o,j)=>{ if(o&&o.h>0&&o.h<o.mh){ const b=o.h; o.h=Math.min(o.mh,o.h+Math.round(o.mh*c.k.segen*KWP.segen/100)); ev.push({t:'heal',s,l:j,d:o.h-b,n:CARD[o.id].n}); } });
    });
  });
  killDead(B,ev); checkOver(B,ev);
  return ev;
}
/* Eine Bahn kämpft: beide Karten schlagen gleichzeitig zu. Leere Bahn oder Flug trifft den Helden. */
function fightLane(B,l){
  const ev=[]; if(B.over) return ev; const A=B.p.lanes[l], E=B.e.lanes[l]; if(!A&&!E) return ev;
  const plan=[], fly={};
  [['p',A,E],['e',E,A]].forEach(([s,c,o])=>{ if(!c||c.a<=0) return; if(!o||(c.k.flug&&!o.k.flug)){ plan.push({s,c,hero:true,why:o?'flug':'leer'}); if(o) fly[s]=1; } else plan.push({s,c,o}); });
  ev.push({t:'clash',l,fly});
  const wut=[];
  plan.forEach(p=>{
    const n=CARD[p.c.id].n;
    const m=outMult(B,p.s,p.c);
    if(p.hero) hurtHero(B,other(p.s),(p.why==='flug'?p.c.a*.5*(1+((p.c.fx&&p.c.fx.flyHero)||0)):p.c.a)*m,ev,p.why,n,l);
    else{ const r=dmgCard(B,other(p.s),l,boosted(p.c,p.o,p.c.a*m),ev,stPct(p.c,p.o),n); if(r.over>0&&p.c.k.durchbruch) hurtHero(B,other(p.s),r.over,ev,'durchbruch',n,l); if(!r.dead&&p.o.k.wut) wut.push([other(p.s),p.o]); }
  });
  wut.forEach(([s,c])=>{ if(c.h>0){ const add=Math.round(c.a0*.1); c.a+=add; ev.push({t:'buff',s,l,n:CARD[c.id].n,why:'wut',d:add}); } });
  killDead(B,ev); checkOver(B,ev);
  return ev;
}
function stars(B){ return Math.max(1,B.p.lanes.filter(Boolean).length); }
/* Deck eines Arena-Rivalen. p = Stärke 0–1 aus seinen Pokalen. lim = Grenzen aus dem Spielerdeck (erste Liga). */
function botDeck(seed,p,lim){
  const r=rng(seed), q=Math.min(1,p), sets=Object.keys(SETS);
  let size=Math.min(DECK_MAX,5+Math.floor(q*3.6)), maxR=q<.1?0:q<.3?1:q<.55?2:3, lvl=Math.max(1,Math.min(MAXLVL,1+Math.round(q*22)));
  if(lim){ size=Math.min(size,lim.n); maxR=Math.min(maxR,lim.r); lvl=Math.min(lvl,lim.l); }
  const s1=sets[Math.floor(r()*sets.length)], s2=sets[Math.floor(r()*sets.length)];
  let pool=BASE.filter(c=>c.r<=maxR&&(c.set===s1||c.set===s2)); if(pool.length<size) pool=BASE.filter(c=>c.r<=maxR);
  pool=shuffle(pool.slice(),r).sort((a,b)=>b.r-a.r);
  return pool.slice(0,size).map(c=>{ const l=Math.max(1,Math.min(MAXLVL,lvl+Math.round((r()-.5)*4))); return {id:c.id,lvl:l,star:Math.min(MAXSTAR,Math.ceil(l/5))}; });
}
function trophyDelta(my,opp,win){ const d=Math.max(-10,Math.min(15,Math.round((opp-my)/5))); return win?26+d:-(14-Math.round(d/2)); }
function simulate(B){ let g=0; while(!B.over&&g++<80){ roundStart(B); for(let l=0;l<LANES&&!B.over;l++) fightLane(B,l); } return B; }
/*ENGINE-END*/
