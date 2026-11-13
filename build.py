import hashlib, json, os
s=open('src.html',encoding='utf8').read()
js=open('engine.js',encoding='utf8').read()+'\n'+open('content.js',encoding='utf8').read()+'\n'+open('app.js',encoding='utf8').read()
assert s.count('/*JS*/')==1
html=s.replace('/*JS*/',js)
open('index.html','w',encoding='utf8').write(html)

# Offline-Speicher für die Web-App: alle Dateien des Spiels, Version aus ihrem Inhalt.
files=['./','index.html','manifest.webmanifest']
h=hashlib.sha1(html.encode())
for d in ['bilder','musik']:
    for root,_,fs in os.walk(d):
        for f in sorted(fs):
            p=os.path.join(root,f).replace(os.sep,'/'); files.append(p); h.update(p.encode()); h.update(str(os.path.getsize(p)).encode())
sw=open('sw-vorlage.js',encoding='utf8').read().replace('/*VERSION*/',h.hexdigest()[:10]).replace('/*DATEIEN*/',json.dumps(files,ensure_ascii=False))
open('sw.js','w',encoding='utf8').write(sw)
print('index.html und sw.js gebaut,',len(files),'Dateien im Offline-Speicher')
