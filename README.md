# Glutstein

Solo-Kartenspiel mit automatischen Kämpfen. Fünf Elemente (Feuer, Wasser, Erde, Schatten, Licht), Kampagne in fünf Gebieten, Arena gegen Computer-Rivalen, freie Sets aus Truhen. Kein Pay-to-win: Glutsteine kaufen nur Aussehen.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src.html` | HTML-Gerüst und alle Styles |
| `engine.js` | Spielregeln und Daten (Karten, Sets, Kampagne, Kampf). Kein DOM, in Node testbar |
| `content.js` | Dialoge, Kartentexte, Erfolge, Tipps |
| `app.js` | Oberfläche, Wirtschaft, Truhen, Musik, Tischeffekte, Sequenzen |
| `build.py` | Fügt alles zu `index.html` zusammen und erzeugt `sw.js` (Offline-Speicher) |
| `manifest.webmanifest`, `sw-vorlage.js` | Web-App fürs iPad: Symbol, Vollbild, Querformat, offline spielbar |
| `bilder/` | Kartenbilder, Rahmen, Symbole, Tische, Landkarten, Sequenzen |
| `musik/` | Musik (Suno) |
| `tools/` | Balance-Simulationen und Screenshot-Test |

## Bauen und testen

```
python3 build.py                         # index.html erzeugen
python3 -m http.server -d .              # im Browser öffnen (Querformat)
node tools/kampagne-sim2.js engine.js    # Siegquoten der Kampagne (h = heroisch)
node tools/set-sim.js engine.js 10       # Sets gegeneinander auf Level 10
python3 tools/webapp-test.py .           # Web-App: startet sie auch offline?
```

`index.html` wird nicht von Hand bearbeitet, sondern immer über `build.py` erzeugt.

## Auf dem iPad

Seite in Safari öffnen, Teilen → „Zum Home-Bildschirm“. Das Spiel startet dann im Vollbild mit eigenem Symbol und läuft nach dem ersten Laden auch offline. Bei einer neuen Version erscheint unten „Neue Version da · Tippen zum Laden“.
