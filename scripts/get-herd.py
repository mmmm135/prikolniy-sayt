import urllib.request,hashlib,urllib.parse
from pathlib import Path
for name,out in [('Elk Herd.webm','elk-herd'),('Deers feeding at Kaliningrad Zoo.webm','deer-herd')]:
 f=name.replace(' ','_');m=hashlib.md5(f.encode()).hexdigest();u=f'https://upload.wikimedia.org/wikipedia/commons/{m[0]}/{m[:2]}/{urllib.parse.quote(f)}'
 try:urllib.request.urlretrieve(u,f'public/art/{out}-source.webm');print(out,Path(f'public/art/{out}-source.webm').stat().st_size)
 except Exception as e: print(e)
