"""Prüft die Web-App: Offline-Speicher wird angelegt und das Spiel startet danach ohne Netz."""
import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
root=sys.argv[1] if len(sys.argv)>1 else '.'
srv=subprocess.Popen(['python3','-m','http.server','8776','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1180,'height':820}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8776/index.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("navigator.serviceWorker.ready")
        for _ in range(60):
            n=await pg.evaluate("caches.keys().then(ks=>ks.length?caches.open(ks[0]).then(c=>c.keys()).then(r=>r.length):0)")
            if n>=200: break
            await pg.wait_for_timeout(1000)
        man=await pg.evaluate("fetch('manifest.webmanifest').then(r=>r.json()).then(j=>j.name+' '+j.display+' '+j.orientation)")
        await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(1500)
        ok=await pg.evaluate("!!document.querySelector('#view') && typeof S==='object' && document.querySelector('#seq')!==null")
        img=await pg.evaluate("new Promise(r=>{const i=new Image();i.onload=()=>r(i.width);i.onerror=()=>r(0);i.src='bilder/karte-1.jpg'})")
        await pg.screenshot(path='/home/claude/shots/w1.png')
        print('im Speicher',n,'| Manifest',man,'| offline gestartet',ok,'| Bild offline',img,'| Fehler',errs)
        await b.close()
asyncio.run(main()); srv.terminate()
