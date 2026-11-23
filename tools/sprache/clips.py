# Schneidet die Aufnahmen in einen Clip pro Folie.
# Vorher einmal: python3 tools/sprache/skript.py (schreibt schnittliste.json)
# Aufruf: python3 tools/sprache/clips.py ton <ordner mit den aufnahmen>
# Die Liste der Clips landet in vox.json und gehört als VOX in content.js.
import json, os, re, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from align import align, segs
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'skript.py')).read().split("if __name__")[0])

SRC = sys.argv[2] if len(sys.argv)>2 else 'aufnahmen'  # Ordner mit den Aufnahmen (erzaehler-1.mp3, funke.mp3, …)
OUT = sys.argv[1]
TMP = tempfile.mkdtemp()
TARGET = -17.0          # Lautheit aller Stimmen
GAP = 0.45              # Pause zwischen zwei Sprechern auf einer Folie
PROLOG = ['intro','a0','s_bluete','s_hanne','b0','a1','s_alder','b1','a2','s_lio','s_moor','s_quelle','s_feuer','b2',
          'a3','s_markt','b3','a4','s_kuppel','s_spiegel','ende']
ECHO = {'stimme','stimme-in','intro-stimme'}

def run(*a): subprocess.run(a, check=True, capture_output=True)
def lufs(f):
    o = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af','ebur128=framelog=quiet','-f','null','-'],capture_output=True,text=True).stderr
    return float(re.findall(r'^\s+I:\s+(-?[\d.]+) LUFS', o, re.M)[-1])

# 1) Jede Quelldatei: Lautheit angleichen, bei der Stimme leichtes Echo, als WAV
def prep(name, path):
    g = TARGET - lufs(path)
    af = f'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono,volume={g:.2f}dB'
    if name in ECHO: af += ',aecho=0.85:0.7:45|95:0.16|0.09'
    w = f'{TMP}/{name}.wav'; run('ffmpeg','-y','-i',path,'-af',af,w); return w

# 2) Absatz-Grenzen je Datei (Sprechstücke mit Rand bis zur Mitte der Lücke)
SPANS = {}   # (datei, seq, folie, k) -> (von, bis)
WAV = {}
files = sorted(f[:-4] for f in os.listdir(SRC) if f.endswith('.mp3'))
for name in files:
    path = f'{SRC}/{name}.mp3'; WAV[name] = prep(name, path)
    _,_,_,rows = align(name, path)
    cnt = {}
    for i,(s,sl,a,b,ratio,gap,txt) in enumerate(rows):
        k = cnt.get((s,sl),0); cnt[(s,sl)] = k+1
        prev_end = rows[i-1][3] if i else 0.0
        nxt = rows[i+1][2] if i+1 < len(rows) else b+0.4
        a2 = max(prev_end + (a-prev_end)/2, a-0.08) if i else max(0.0, a-0.05)
        b2 = min(b + (nxt-b)/2, b+0.22)
        SPANS[(name,s,sl,k)] = (a2,b2)

# Intro aus den Testaufnahmen von heute Mittag (Abschnitte von Hand bestimmt)
WAV['intro-erzaehler'] = prep('intro-erzaehler',f'{SRC}/intro-erzaehler.mp3')
WAV['intro-stimme'] = prep('intro-stimme',f'{SRC}/intro-stimme.mp3')
INTRO = {1:[('intro-erzaehler',0.0,6.55)], 2:[('intro-erzaehler',6.80,14.45)], 3:[('intro-erzaehler',14.95,16.75)],
         4:[('intro-erzaehler',16.95,26.30)], 5:[('intro-erzaehler',26.45,34.55)],
         6:[('intro-erzaehler',34.70,36.95),('intro-stimme',0.0,4.70)],
         7:[('intro-erzaehler',37.10,43.40)], 8:[('intro-stimme',4.80,10.03),('intro-erzaehler',43.45,45.71)]}

# 3) Stücke pro Folie in Spielreihenfolge
pieces = {}   # clipname -> [(wavname, von, bis)]
for sl, lst in INTRO.items():
    pieces[f'intro-{sl}'] = list(lst)
cnt = {}
for s,sl,f,t in E:
    if s not in PROLOG or s=='intro' or f=='stimme-in': continue
    k = cnt.get((f,s,sl),0); cnt[(f,s,sl)] = k+1
    if (f,s,sl,k) not in SPANS: raise SystemExit(f'fehlt: {f} {s} {sl}')
    a,b = SPANS[(f,s,sl,k)]
    pieces.setdefault(f'{s}-{sl}',[]).append((f,a,b))
# Kartenbinderin: gleiche Folie, aber die Stein-Sätze aus stimme-in
w_intro = SPANS[('stimme-in','intro',6,0)]
pieces['intro-6-w'] = [pieces['intro-6'][0], ('stimme-in',)+w_intro]
for s,sl,f,t in E:
    if f!='stimme-in' or s=='intro' or s not in PROLOG: continue
    base = pieces[f'{s}-{sl}']; ab = SPANS[('stimme-in',s,sl,0)]
    # das Stück aus "stimme" mit Kartenbinder ersetzen
    kb_idx = [i for i,(ff,a,b) in enumerate(base) if ff=='stimme']
    alt = list(base); alt[kb_idx[0]] = ('stimme-in',)+ab
    pieces[f'{s}-{sl}-w'] = alt

# 4) Zusammensetzen und als MP3 schreiben
os.makedirs(OUT, exist_ok=True)
for clip, lst in pieces.items():
    inputs, filt = [], []
    for i,(f,a,b) in enumerate(lst):
        inputs += ['-i', WAV[f]]
        filt.append(f'[{i}]atrim={a:.3f}:{b:.3f},asetpts=N/SR/TB,afade=t=in:d=0.012,afade=t=out:st={max(0,b-a-0.04):.3f}:d=0.04[p{i}]')
    chain = ''
    for i in range(len(lst)):
        if i: filt.append(f'anullsrc=r=44100:cl=mono,atrim=0:{GAP},aformat=sample_fmts=fltp[g{i}]'); chain += f'[g{i}]'
        chain += f'[p{i}]'
    n = 2*len(lst)-1
    filt.append(f'{chain}concat=n={n}:v=0:a=1,alimiter=limit=0.89:level=disabled[o]')
    run('ffmpeg','-y',*inputs,'-filter_complex',';'.join(filt),'-map','[o]','-ac','1','-ar','44100','-c:a','libmp3lame','-b:a','64k',f'{OUT}/{clip}.mp3')
print(len(pieces),'Clips')
json.dump(sorted(pieces), open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'vox.json'),'w'))
