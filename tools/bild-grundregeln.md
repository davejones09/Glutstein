# Bilder für Glutstein

Vorlage für alle Bild-Prompts (GPT). Die Grundregeln kommen als erste Nachricht in einen neuen Chat, danach die Set-Liste. Prompts immer auf Deutsch und in diesem Aufbau.

## Grundregeln

```
GRUNDREGEL für alle Bilder dieses Chats (Kartenspiel „Glutstein")

FORMAT (wichtigste Regel)
- Jedes Kartenbild ist HOCHFORMAT 2:3, 1024 × 1536 Pixel. Höher als breit.
- Niemals Querformat, niemals quadratisch. Wenn ein Bild nicht im Hochformat herauskommt, erzeuge es sofort neu.
- Ein anderes Format gilt nur, wenn ich es beim einzelnen Motiv ausdrücklich dazuschreibe.

ABLAUF
- Ich schicke dir Listen mit nummerierten Motiven. Male immer nur das eine Motiv, dessen Nummer ich nenne.

STIL
- Gemalte Fantasy-Illustration wie bei einem hochwertigen Sammelkartenspiel.
- Breite, glatte Pinselstriche, dunkle Grundstimmung mit leuchtendem Motiv, dramatisches Licht von schräg oben.
- Keine Punkt- oder Mosaikstruktur, kein Fotorealismus, kein 3D-Render, keine Pixelart, kein Comic-Look.
- Ton: düster-märchenhaft, nicht blutig.
- Alle Bilder sollen aussehen wie vom selben Künstler. Halte Stil, Strich und Lichtstimmung gleich.
- Jede Figur eines Sets hat ein eigenes, klar unterscheidbares Gesicht, eine eigene Frisur und Haarfarbe sowie ein anderes Alter oder einen anderen Körperbau. Es sind verschiedene Personen, nicht dieselbe Person in anderen Rollen.

BILDAUFBAU
- Ein einzelnes Hauptmotiv, mittig im oberen Zweidrittel, Kopf im oberen Drittel.
- Das Motiv hebt sich in der Helligkeit klar vom Hintergrund ab. Der Hintergrund ist deutlich dunkler und ruhiger als das Motiv.
- Das untere Drittel ist wirklich dunkel und detailarm: keine helle Gischt, kein weißer Stoff, keine Gegenstände. Dort liegen später Name und Werte.
- Die Ecke oben links bleibt frei von Köpfen, Waffen und Lichtquellen.
- Nichts Wichtiges am Rand, das Bild wird leicht beschnitten.

HINTERGRUND
- Einfach, unscharf, in der Farbwelt des Sets.
- Gibt meine Liste eine eigene Farbwelt für das Set vor, gilt diese.
- Sonst nach Element:
  Feuer = Orange, Rot, Glutlicht, Asche, Funken
  Wasser = Türkis, Tiefblau, Gischt, Nebel
  Erde = Moosgrün, warmes Waldlicht, Blätter
  Schatten = Violett, Nachtschwarz, fahles Mondlicht
  Licht = Gold, Weiß, Sonnenstrahlen vor dunklem Gewitterhimmel

SONDERKARTEN
- Sonderkarten zeigen dieselbe Figur wie die normale Karte, aber in einem größeren, epischeren Moment: andere Pose, andere Szene, mehr Licht und Bewegung.
- KEIN Rahmen, kein Ornament am Rand, keine Edelsteine, keine Kartenkante. Das Bild geht bis an den Rand.
- Die Figur darf größer im Bild stehen als auf der normalen Karte. Alle anderen Regeln gelten weiter.

VERBOTEN
- Text, Buchstaben, Zahlen, Logos, Signaturen, Wasserzeichen, Rahmen, Kartenränder, Karten-Layout, UI-Elemente.

Bestätige kurz und warte auf meine Liste.
```

## Aufbau einer Set-Liste (Beispiel)

Kopfzeile mit Setname, Thema und Format, dann Farbwelt, Elementverteilung, Stimmung und die nummerierten Motive.

```
Set „VARIETÉ", Horror, ein unheimlicher Wanderzirkus, der nur nachts in einem Nebeltal auftaucht, Hochformat 2:3, kein Rahmen.
Farbwelt: verblasstes Rot und Weiß gestreifter Zelte, schmutziges Gold, Nachtschwarz, giftiges Violett, kränkliches Laternenlicht, Nebel.
Schatten-Karten (1, 3, 4, 6) mit violettem Leuchten, Licht-Karten (2 und 5) mit flackerndem, unheimlich goldweißem Licht.
Stimmung: verstörend, schaurig-schön, falsches Lächeln, alles leicht verfallen. Kein Blut, kein Gore.

1. Messerwerferin: eine irre grinsende Messerwerferin mit zerzaustem Haar und zerrissenem Zirkuskostüm jongliert ein halbes Dutzend Messer, hinter ihr eine Drehscheibe voller Messer, die Augen weit aufgerissen, violettes Licht.
2. Seiltänzerin: eine bleiche Seiltänzerin mit gesprungener Porzellanmaske balanciert auf einem Seil hoch über der Manege, unter ihr nur schwarzer Nebel statt Boden, ein einzelner goldweißer Scheinwerfer erfasst sie.
3. Wahrsagerin: eine alte Wahrsagerin mit Schleier und vielen Ringen beugt sich über eine Kristallkugel, in der ein schreiendes Gesicht zu sehen ist, Tarotkarten und Kerzen auf dem Tisch, violetter Rauch.
4. Puppenspieler: ein hagerer Puppenspieler mit Zylinder, dessen lange Finger an Fäden lebensgroße, zerbrochene Marionetten tanzen lassen, sein Gesicht im Schatten, nur ein breites Lächeln ist zu sehen.
5. Der Feuerschlucker: ein muskulöser Feuerschlucker mit genähtem Grinsen speit eine Fontäne aus goldweißem, unnatürlich leuchtendem Feuer in die Nacht, Funken regnen auf leere Zuschauerränge.
6. Der Zirkusdirektor: ein riesenhafter Zirkusdirektor in zerschlissenem rotem Frack mit Zylinder und Peitsche steht mit ausgebreiteten Armen in der Mitte der Manege, sein Lächeln reicht unnatürlich weit, hinter ihm wachsen Schatten zu einem Zelt aus Dunkelheit, violette Augen leuchten im Publikum.
```

## Andere Bildarten

Beim einzelnen Motiv immer das Format dazuschreiben:
- Heldenporträts: quadratisch, mit Goldrahmen, grüner Hintergrund (#00FF00) zum Freistellen.
- Logo, Symbole, Gegenstände: grüner Hintergrund (#00FF00), kein Grün im Motiv.
- Tische, Menü, Sequenzen: Querformat 3:2.

## Musik (Suno)

Stilfeld auf Englisch, „Instrumental“ an. Pro Bereich liegen Stücke in `musik/` (`menue`, `karte`, `kampf`, `endgegner`, `arena`, jeweils mit `-2` usw.), komprimiert auf 96 kbit/s. Neue Stücke in `POOLS` in app.js eintragen.

## Soundeffekte

Liegen in `sfx/` (Mono, 64 kbit/s, auf gleiche Lautstärke gebracht). Quellen: Pixabay (Lizenz erlaubt Nutzung im Spiel ohne Namensnennung).
schlag (Treffer), karte (Karte legen/aufdecken), truhe (Truhe öffnen), tod (Karte stirbt), held (Held getroffen), heilung, faehigkeit (Einschlag), aufwerten (Level/Stern), nein (nicht möglich), funkeln (seltene Karte), klick (Knöpfe). Münz-Sound fehlt noch.
