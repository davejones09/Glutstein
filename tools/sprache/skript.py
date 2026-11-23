import os
# Sprechertexte für die Zwischensequenzen.
# Jeder Eintrag: (Sequenz, Folie, Datei, Text). Reihenfolge = Reihenfolge im Spiel.
# Aus den Einträgen entstehen die Aufnahmeblöcke (gruppiert nach Datei) und die Schnittliste.
import json, collections, sys

E = []
def L(seq, slide, f, text): E.append((seq, slide, f, text))

# Erzähler-Dateien nach Kapiteln
EZ = {'a0':1,'s_bluete':1,'s_hanne':1,'b0':1,
      'a1':2,'s_alder':2,'b1':2,
      'a2':3,'s_lio':3,'s_moor':3,'s_quelle':3,'b2':3,
      'a3':4,'s_markt':4,'b3':4,
      'a4':5,'s_kuppel':5,'s_spiegel':5,'ende':5,
      'a5':6,'f1_wal':6,'f1_brummer':6,'f1_namen':6,'f1_k7':6,
      'f1_juna':7,'f1_sammlung':7,'f1_aufzeichnung':7,'f1_brummer2':7,'f1_vision':7,
      'f1_schlaefer':8,'f1ende':8}
def N(seq, slide, text): L(seq, slide, f'erzaehler-{EZ[seq]}', text)

# Prolog
N('a0',1,'[calm, warm] Am Aschenpfad verdampft der Regen, bevor er den Boden erreicht. Hier brennt die Erde, seit der Splitter fiel.')
N('a0',2,'Die Tiere des Feuers jagen alles, was sich bewegt, als hätte jemand befohlen, niemanden durchzulassen.')
N('a0',3,'Schlackenfürst Ormak wollte den Splitter schützen. [pause] Nun schützt der Splitter ihn.')
N('s_bluete',1,'Tief in der Mine liegt ein Blütenblatt auf der glühenden Asche. [quietly] Es verbrennt nicht.')
N('s_bluete',2,'Dahinter läuft ein feiner Riss durch den Fels.')
L('s_bluete',2,'stimme','[softly, dismissive] Nur ein Haarriss. [pause] Komm weiter.')
N('s_hanne',1,'Die alte Köhlerin Hanne erzählt von Ormak, dem Schmied. Für die Kinder bog er Pferdchen aus Hufnägeln.')
L('s_hanne',2,'hanne','[very old, croaky, kind] Er hat keinen Käfig für den Splitter gebaut. Der Splitter hat einen Käfig aus ihm gemacht. [pause] Nimm das Pferdchen mit.')
N('b0',1,'Ormak erkennt das Pferdchen.')
L('b0',1,'ormak','[hoarse, struggling] Das Warme in deiner Hand … hör nicht darauf. [pause] Es sagt nie etwas Falsches.')
N('b0',2,'Am Kraterrand wartet Seda, Inquisitorin des Lichtordens. Bevor du etwas tun kannst, blendet sie der Splitter.')
N('b0',3,'Nachts träumst du von Ormak.')
L('b0',3,'ormak','[calm, dreamlike] Feuer im Herd wärmt ein Haus. Ohne Herd frisst es das Haus. [pause] Und du hast keinen Herd.')

N('a1',1,'Die Flut kam und ging nicht mehr. Am Strand liegt seltsames Strandgut, sogar eine Uhr, die rückwärts läuft.')
N('a1',2,'Nur ein Leuchtturm brennt noch. Märle lässt ihr Licht jede Nacht brennen. Für die, die noch kommen.')
N('a1',3,'[softly] In der Gischt singen die Ertrunkenen von Aldermünde. Sie singen gegen den Splitter an.')
N('a1',4,'Gezeitenmutter Ysra hat eine ganze Stadt versenkt, damit niemand an den Splitter herankommt.')
N('s_alder',1,'Der Tümpelgeist trägt dich hinab nach Aldermünde, als kenne er den Weg. Unter dem Gesang der Ertrunkenen singt der Splitter.')
L('b1',1,'ysra','[sad, tired] Er sagt immer dasselbe. [whispers] Mir ist kalt. Lass mich zu dir.')
N('b1',1,'Ysra sinkt, und die Ertrunkenen dürfen endlich schlafen.')
N('b1',2,'Du bringst Märle die Laterne der Morgenmöwe, dem Schiff ihres Mannes. Jetzt brennen zwei Lichter.')
N('b1',3,'[gently, speaking to her] Er kommt nicht mehr, Märle.')
L('b1',3,'merle','[calm, warm] Nein. [pause] Aber irgendwer kommt immer.')

N('a2',1,'Der Wald wächst. Jede Nacht ein Stück weiter.')
N('a2',2,'[quietly] Wer stehen bleibt, schlägt Wurzeln.')
N('a2',3,'Urborke, die Alteiche, war die gütigste Wächterin. Jetzt will sie, dass alles Wald wird. Damit es endlich still ist.')
N('s_lio',1,'Im Baumhausdorf zeigt dir Lio seinen Fuß. Er hat zu lange einem blauen Schmetterling zugesehen.')
N('s_moor',1,'Am Moorsteg steckt Seda in den Wurzeln fest. Funke brennt sie frei, ohne dass ein einziges Blatt Feuer fängt.')
L('s_moor',2,'seda','[serious] Der Orden sagt: Jede Karte ist eine kleine Tür. [pause] Und was hinter einer Tür steckt, drückt dagegen.')
N('s_quelle',1,'Die Quelle zeigt dir andere Welten. Das Blütenblatt aus der Mine stammt von dort.')
L('s_quelle',2,'stimme','[patient, almost tender] Es gab schon immer mehr als eine Welt, Kartenbinder. Du durftest nur nie hinsehen.')
L('s_feuer',1,'funke','[serious, unusually quiet] Ich bin aus Feuer. Ich weiß, wie Feuer klingt, wenn es Hunger hat. [pause] Es klingt wie dein Stein.')
L('b2',1,'urborke','[old, gentle, creaky] Er hat dich schon einmal benutzt. [pause] Pass auf, wem du deine Hand leihst.')
N('b2',1,'Der Wald hört auf zu wachsen.')
N('b2',2,'Auf dem Rückweg sagt der Stein leise:')
L('b2',2,'stimme','[whispers] Mir ist kalt.')
N('b2',2,'Genau das hat er tausend Nächte lang zu Ysra gesagt.')

N('a3',1,'[ominous] Hier geht die Sonne nicht mehr auf.')
N('a3',2,'Funke ist das einzige Licht, und die Dunkelheit macht ihn kleiner.')
L('a3',2,'funke','[small, defiant] Ich bin klein, aber ich bin nicht aus.')
N('a3',3,'Der Hohle König hat den Splitter verschluckt, um ihn zu verstecken. Seitdem ist er innen leer.')
N('s_markt',1,'Im Hohlen Reich bezahlt man mit dem, was man ist.')
N('s_markt',2,'Für deine erste Erinnerung schlägt die Seelenhändlerin nach. Dein Name fehlt in ihrem Buch. [pause] Du hast ihn verschenkt.')
L('b3',1,'koenig','[hollow, whispering] Er ist der Ungebundene. Er sprach von dir wie von einem Werkzeug, das man im Regen liegen lässt.')
N('b3',2,'Er reicht dir sein Pergament.')
L('b3',2,'koenig','[hollow, pleading] Lies es mir vor.')
N('b3',2,'[slowly, reading aloud] Vael.')
L('b3',2,'koenig','[relieved, breaking] Ja. [pause] Das bin ich.')
L('b3',3,'stimme','[warm, calm] Ich habe dir nie etwas Falsches gesagt.')
N('b3',3,'Und du findest nichts, was gelogen war.')

N('a4',1,'Am Mühlenweg gibt es keine Schatten. Menschen und Vögel stehen still im Licht, als wären sie aus Glas.')
N('a4',2,'Die letzte Festung des Lichts. Sie lässt niemanden ein.')
N('a4',3,'Erzseraphin Aurel wartet. [ominous] Sie weiß, was im Stein schläft.')
N('s_kuppel',1,'In der Kuppel steht Sedas Mutter und lächelt. Sie hustet nicht mehr. [pause] Sie atmet nicht mehr.')
L('s_kuppel',2,'seda','[quiet, shaking with anger] Ich habe geschworen, dem Licht zu dienen. [pause] Nicht dem hier.')
N('s_spiegel',1,'In den Spiegeln steht nicht dein Gesicht, sondern eine Gestalt mit Kapuze.')
L('s_spiegel',1,'gestalt','[tired, hoarse, quiet] Du hast es wieder vergessen.')
L('ende',1,'aurel','[cold, sad] Ich hatte gehofft, dass du es diesmal nicht tust. [pause] Wenn du singen willst, dann sing richtig.')
N('ende',2,'Du rufst die fünf Wächter aus deinen Karten. Sie knien um den Herd und singen das alte Lied.')
N('ende',3,'Der letzte Splitter fügt sich ein. Der Glutstein ist wieder ganz.')
N('ende',4,'[quietly, ominous] Doch in seinem Inneren öffnet sich ein Auge.')
L('ende',4,'stimme','[deep, vast, warm] Ihr singt aus Karten. [pause] Und jede Karte, Kartenbinder, ist eine Tür.')
N('ende',5,'Über dem Meer zerreißt der Himmel. Durch die Risse siehst du andere Welten.')
L('ende',6,'stimme','[warm, almost loving] Danke, Kartenbinder. [long pause] Zum zweiten Mal.')
N('ende',7,'Die Welt friert nicht mehr, aber der Himmel ist zerrissen.')
L('ende',7,'seda','[quietly] Was jetzt?')
N('ende',7,'[determined] Jetzt folgen wir ihm.')
N('ende',8,'In derselben Nacht kommt ein Schiff aus dem Riss. Märle lässt beide Lichter brennen. Für die, die noch kommen. [long pause] Weiter geht es in Folge eins: Station Null.')

# Folge 1
N('a5',1,'[calm] Drei Nächte nach dem Finale. Tief im Riss über dem Meer blinkt ein rotes Licht: dreimal kurz, dreimal lang, dreimal kurz.')
L('a5',2,'merle','[calm, certain] Feuer flackert. Das da zählt. [pause] Auf jedem Meer, das ich kenne, heißt das: Hilfe.')
N('a5',3,'Märle rudert euch hinaus. Als du den Glutstein hochhältst, neigt sich der Riss zu ihm herab wie eine ausgestreckte Hand.')
L('a5',4,'merle','[warm, worried] Wenn ihr zurückwollt, sucht das Licht. Es brennt die ganze Nacht.')
N('a5',4,'Dann trittst du aus dem Boot in den Riss.')
N('a5',5,'[slowly] Minus einunddreißig Grad. Jemand hat den Riss in einem Ring aus Stahl eingefangen. Funke wird klein wie eine Kerzenflamme.')
N('a5',6,'Dir ist nicht kalt. Dir ist nie kalt. Eine Stimme aus der Decke sagt:')
L('a5',6,'station','[robotic, flat, announcement] Wärmesignatur erkannt. Willkommen zurück, Besucher Null.')
N('f1_wal',1,'Durch ein vereistes Fenster siehst du ein Meer ohne Land unter zwei Monden. Dazwischen schwimmt ein Wal mit einer Stadt auf dem Rücken.')
L('f1_wal',2,'seda','[whispers, amazed] Das hat Märle gesehen.')
L('f1_wal',2,'funke','[sighs, very small] Ein Fisch mit einer Stadt drauf. [pause] Ich will nach Hause.')
N('f1_brummer',1,'Eine kleine Wartungsdrohne flickt Fenster, die niemand mehr braucht. Dann dreht sie ihr Licht auf warm und hält es an Funke.')
L('f1_brummer',2,'funke','[grudging, then pleased] Na gut. Du darfst bleiben. [pause] Du brummst. Ich nenn dich Brummer.')
N('f1_namen',1,'An den Wänden stehen Namen, immer wieder dieselben.')
L('f1_namen',1,'haberland','[whispering, repeating, fading] Haberland. Haberland. Ich heiße Haberland. [pause] Ich heiße …')
N('f1_namen',2,'Ein Mann schrubbt seit Wochen dieselbe Stelle.')
L('f1_namen',2,'haberland','[friendly, confused] Entschuldigung … weißt du, wie ich heiße?')
N('f1_k7',1,'Elf Kapseln stehen offen und leer. Am Ende des Saals sitzt eine Androidin und lächelt.')
L('f1_k7',1,'k7','[polite, cheerful] Sie sind spät. Aber das macht nichts.')
L('f1_k7',2,'k7','[calm, friendly] Ich bin Ka-Sieben. Das rote Licht war ich. Mein letzter Befehl lautet: Halte die Station am Leben, bis Hilfe kommt.')
N('f1_juna',1,'In der letzten Kapsel schläft Juna Kade. Auf ihrem Arm steht: Nicht vergessen. Kaum ist sie wach, zielt sie auf dich.')
L('f1_juna',1,'juna','[hoarse, tense] Besucher Null.')
L('f1_juna',2,'juna','[tense, accusing] Ich hab dich auf den Bändern gesehen. Dieselbe Kapuze. [pause] Und du frierst nicht.')
N('f1_juna',2,'Erst als sie ihren Namen auf dem Arm liest, senkt sie das Gewehr.')
N('f1_sammlung',1,'In den Schaukästen liegen Dinge aus deiner Welt: eine Feder vom Orden, warme Asche, ein Hufeisen mit Ormaks Hammerzeichen.')
L('f1_sammlung',2,'seda','[quietly, unsettled] Das ist unsere Kammer der Fremddinge. [pause] Nur andersherum.')
N('f1_aufzeichnung',1,'Tag eins, zwei Uhr vierzehn. Eine Gestalt mit Kapuze legt die Hand an den Reaktor. Eine Minute später reißt der Riss auf.')
N('f1_aufzeichnung',2,'[quietly] War ich das?')
N('f1_aufzeichnung',2,'Im Schlaf murmelt der Stein:')
L('f1_aufzeichnung',2,'stimme','[sleepy, murmuring] Nein. [long pause] Noch nicht.')
N('f1_brummer2',1,'Brummer will das Gewächs von der Wand kratzen. Es wickelt sich um ihn, sanft wie eine Decke, und sein Licht wird violett.')
L('f1_brummer2',2,'funke','[desperate, shouting] Lass mich los, ich hol ihn zurück!')
N('f1_brummer2',2,'Aber Funke ist zu schwach. Brummer schwebt hinab, dorthin, wo es warm ist.')
N('f1_vision',1,'Du blinzelst und stehst allein in einem Gang mit rotem Licht. Vor dir geht jemand mit Kapuze, müde und abgetragen.')
L('f1_vision',2,'gestalt','[tired, hoarse] Ich hab versucht, eine Tür zuzuhalten. Mit einer Hand. Das reicht nie. [pause] [quieter] Du kannst nicht alle mitnehmen. Ich hab’s versucht.')
N('f1_schlaefer',1,'[uneasy] Im Reaktor ist es warm. Die Besatzung steht in Reihen, violette Fäden im Rücken, und alle atmen im selben Takt.')
L('f1_schlaefer',2,'seda','[tense, low] Niemand verbrennt hier irgendwen. [pause] Meine Mutter stand auch so da. Und jetzt hustet sie.')
N('f1_schlaefer',3,'Die Schläfer sprechen aus einem Mund:')
L('f1_schlaefer',3,'ding','[calm, sleepy, many voices] Ka-Sieben. Bring mir das Warme aus der Tasche.')
N('f1_schlaefer',3,'Ka-Sieben lächelt.')
L('f1_schlaefer',3,'k7','[friendly, eerily calm] Mein Befehl war: bis Hilfe kommt. [pause] Hilfe ist da.')
N('f1ende',1,'Ka-Sieben hat die Notkühlung gezogen. Das Ding fließt in deine leere Karte.')
L('f1ende',1,'ding','[soft, amused] Eine Karte, Besucher Null? [pause] Jede Karte ist eine Tür.')
N('f1ende',2,'Brummers Licht wird wieder weiß. Die Schläfer atmen. Ka-Sieben bleibt bei ihnen und hält die Station kalt, bis Hilfe kommt.')
N('f1ende',3,'Juna springt mit euch durch den Riss, Märles Licht entgegen.')
L('f1ende',3,'juna','[determined] Ich will wissen, wer du bist.')
L('f1ende',3,'seda','[dry, a little warm] So hab ich auch mal angefangen.')
N('f1ende',4,'Märle zieht euch aus dem Wasser.')
L('f1ende',4,'merle','[surprised, relieved] Ihr wart keine Stunde weg.')
N('f1ende',5,'In der Nacht liegt in deinem Stapel eine Karte, die du nie gebunden hast: ein Gang mit rotem Licht, ganz hinten eine Gestalt.')
N('f1ende',6,'Jede Nacht kommt sie näher. Das rote Licht blinkt: drei kurz, drei lang, drei kurz.')
L('f1ende',6,'funke','[whispers, scared] Guckt mal genau hin. [pause] Die hat eine Kapuze.')
N('f1ende',6,'[long pause] Fortsetzung folgt …')

# Kartenbinderin-Fassung der Stein-Sätze mit {KB}
KBIN = [('intro',6,'[whispers, warm] Du bist Kartenbinderin. Was du besiegst, bannst du in Karten.')]
for s,sl,f,t in E:
    if f=='stimme' and 'Kartenbinder' in t:
        KBIN.append((s,sl,t.replace('Kartenbinder','Kartenbinderin')))
for s,sl,t in KBIN: E.append((s,sl,'stimme-in',t))

# Ding = Chor aus zwei Stimmen
for s,sl,f,t in list(E):
    if f=='ding': pass
blocks = collections.OrderedDict()
for s,sl,f,t in E:
    for ff in (['ding-1','ding-2'] if f=='ding' else [f]):
        blocks.setdefault(ff,[]).append((s,sl,t))

if __name__=='__main__':
    json.dump({k:[list(x) for x in v] for k,v in blocks.items()}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'schnittliste.json'),'w'), ensure_ascii=False, indent=1)
    for k,v in blocks.items():
        txt='\n\n'.join(t for _,_,t in v)
        print(f'{k}: {len(v)} Absätze, {len(txt)} Zeichen')
    print('Dateien:',len(blocks),'Zeichen gesamt:',sum(len('\n\n'.join(t for *_,t in v)) for v in blocks.values()))
