import urllib.request
from pathlib import Path
u='https://assets.mixkit.co/videos/1873/1873-1080.mp4'
try:
 urllib.request.urlretrieve(u,'public/art/work-branch-source.mp4');print('branch downloaded',Path('public/art/work-branch-source.mp4').stat().st_size)
except Exception as e:print(e)
