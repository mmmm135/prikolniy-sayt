import urllib.request,re,json
from pathlib import Path
urls=['https://pixabay.com/videos/deer-herd-nature-wild-life-1948/','https://www.pexels.com/video/deer-herd-grazing-in-tranquil-countryside-34778322/','https://sketchfab.com/3d-models/animated-deer-4cff1e63f4e941198b3d56300b3393b9']
for i,u in enumerate(urls):
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})) as r: data=r.read().decode();print(u,r.status)
  Path(f'research-{i}.html').write_text(data,encoding='utf8');print(re.findall(r'https[^\s"<>]+\.mp4[^\s"<>]*',data)[:10])
 except Exception as e: print(e)
