s=open('src.html',encoding='utf8').read()
js=open('engine.js',encoding='utf8').read()+'\n'+open('content.js',encoding='utf8').read()+'\n'+open('app.js',encoding='utf8').read()
assert s.count('/*JS*/')==1
open('index.html','w',encoding='utf8').write(s.replace('/*JS*/',js))
