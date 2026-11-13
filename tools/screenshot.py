import asyncio, subprocess, time
from playwright.async_api import async_playwright
srv=subprocess.Popen(['python3','-m','http.server','8775','-d','.'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
O='shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':844,'height':390},device_scale_factor=2); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8775/index.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("seqEnd(); closeSheet(); S.tut=false; S.seen={intro:1,a0:1,a1:1,a2:1}; for(let i=1;i<=16;i++) S.stars[i]=3; ['aschendrache','leviathan','alteiche','sturmrufer','seraphin'].forEach(id=>S.cards[id]={lvl:5,star:1,dup:0}); S.decks[0]=['aschendrache','leviathan','alteiche','sturmrufer','seraphin','funkenwicht']; tab='deck'; render()")
        await pg.wait_for_timeout(500); await pg.screenshot(path=O+'r1.png')
        await pg.evaluate("tab='map'; render(); ACT.fight('17')"); await pg.wait_for_timeout(300); await pg.click('[data-act=fightGo]'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=O+'r2.png'); print(errs, await pg.evaluate("document.querySelectorAll('.adv').length"))
        await b.close()
asyncio.run(main()); srv.terminate()
