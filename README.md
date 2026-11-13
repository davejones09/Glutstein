# Glutstein

Solo-Kartenspiel mit automatischen Kämpfen. Fünf Elemente (Feuer, Wasser, Erde, Schatten, Licht), Kampagne in fünf Gebieten, Arena gegen Computer-Rivalen, freie Sets aus Truhen. Kein Pay-to-win: Glutsteine kaufen nur Aussehen.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src.html` | HTML-Gerüst und alle Styles |
| `engine.js` | Spielregeln und Daten (Karten, Sets, Kampagne, Kampf). Kein DOM, in Node testbar |
| `content.js` | Dialoge, Kartentexte, Erfolge, Tipps |
| `app.js` | Oberfläche, Wirtschaft, Truhen, Musik, Tischeffekte, Sequenzen |
| `build.py` | Fügt alles zu `index.html` zusammen |
| `bilder/` | Kartenbilder, Rahmen, Symbole, Tische, Landkarten, Sequenzen |
| `musik/` | Musik (Suno) |
| `tools/` | Balance-Simulationen und Screenshot-Test |

## Bauen und testen

```
python3 build.py                         # index.html erzeugen
python3 -m http.server -d .              # im Browser öffnen (Querformat)
node tools/kampagne-sim.js engine.js     # Siegquoten der Kampagne
node tools/set-sim.js engine.js 10       # Sets gegeneinander auf Level 10
```

`index.html` wird nicht von Hand bearbeitet, sondern immer über `build.py` erzeugt.
