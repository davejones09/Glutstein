import os
import json,re,subprocess,sys
L=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'schnittliste.json')))
def segs(f,th=-40,d=0.25):
    out=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af',f'silencedetect=noise={th}dB:d={d}','-f','null','-'],capture_output=True,text=True).stderr
    dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
    st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',out)]
    en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',out)]
    sil=list(zip(st,en+[dur]*(len(st)-len(en))))
    sp=[];t=0.0
    for a,b in sil:
        if a-t>0.05: sp.append([t,a])
        t=b
    if dur-t>0.05: sp.append([t,dur])
    return sp,dur
def clean(t): return re.sub(r'\[[^\]]*\]','',t).strip()
def npause(t): return t.count('[pause]')+2*t.count('[long pause]')
def align(name,f):
    paras=[(s,sl,t) for s,sl,t in L[name]]
    sp,dur=segs(f)
    n,m=len(sp),len(paras)
    ch=[len(clean(t)) for *_,t in paras]; pz=[npause(t) for *_,t in paras]
    span=sp[-1][1]-sp[0][0]
    r=sum(ch)/(span-0.7*(m-1)-0.6*sum(pz))
    INF=1e18
    # dp[i][j]: first i segs into j paras
    dp=[[INF]*(m+1) for _ in range(n+1)]; bk=[[0]*(m+1) for _ in range(n+1)]
    dp[0][0]=0
    for j in range(1,m+1):
        exp=ch[j-1]/r+0.6*pz[j-1]
        for i in range(j,n+1):
            for k in range(j-1,i):
                if dp[k][j-1]>=INF: continue
                d=sp[i-1][1]-sp[k][0]
                c=((d-exp)/max(exp,0.8))**2
                if k>0: c+=0.15/max(sp[k][0]-sp[k-1][1],0.05)  # kurze Lücke als Grenze bestrafen
                if dp[k][j-1]+c<dp[i][j]: dp[i][j]=dp[k][j-1]+c; bk[i][j]=k
    if n<m: return name,n,m,None
    res=[];i=n
    for j in range(m,0,-1):
        k=bk[i][j]; res.append((k,i)); i=k
    res.reverse()
    rows=[]
    for j,(k,i) in enumerate(res):
        a,b=sp[k][0],sp[i-1][1]; exp=ch[j]/r+0.6*pz[j]
        gap_after = (sp[i][0]-b) if i<n else None
        rows.append((paras[j][0],paras[j][1],round(a,2),round(b,2),round((b-a)/exp,2),round(gap_after,2) if gap_after is not None else None,clean(paras[j][2])[:50]))
    return name,n,m,rows
if __name__=='__main__':
    for name in sys.argv[1:]:
        nm,n,m,rows=align(name,f'{name}.mp3')
        print(f'\n== {nm}: {n} Sprechstücke, {m} Absätze erwartet')
        if rows is None: print('  ZU WENIGE STÜCKE'); continue
        for r in rows:
            flag='  <<' if not (0.65<=r[4]<=1.5) else ''
            print(f'  {r[0]:<16}{r[1]:>2} {r[2]:>6}-{r[3]:<6} x{r[4]:<5} lücke {r[5]}  {r[6]}{flag}')
