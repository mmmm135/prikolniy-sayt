import urllib.request,re
from pathlib import Path
u='https://mixkit.co/free-stock-video/deer/'
s=urllib.request.urlopen(u).read().decode()
Path('research-mixkit.html').write_text(s,encoding='utf8')
print('\n'.join(re.findall(r'(?:href|src)="([^"]+)"',s)[:100]))
