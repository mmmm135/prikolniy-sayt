from PIL import Image,ImageDraw
import numpy as np
from pathlib import Path
root=Path('work/loading-butterfly')
# Sixty filmed frames rendered to a filmstrip: CSS plays real motion before hydration.
indices=np.linspace(0,89,60).astype(int)
atlas=Image.new('RGBA',(288,256*60),(0,0,0,0))
for frame,index in enumerate(indices):
 data=np.array(Image.open(root/f'density-{index:03}.png').convert('L').resize((144,128)))/255
 tile=Image.new('RGBA',(288,256),(0,0,0,0));pen=ImageDraw.Draw(tile)
 for x in range(144):
  for y in range(x%3,128,3):
   d=data[y,x]
   if d>.07:pen.rectangle((x*2,y*2,(x+.4+d*.38)*2,(y+1.1+d*1.9)*2),fill=(201,184,148,int(255*(.5+d*.5))))
 atlas.paste(tile,(0,frame*256))
atlas.save('public/art/loading-butterfly-filmstrip.webp',lossless=True,method=6)
print(Path('public/art/loading-butterfly-filmstrip.webp').stat().st_size)
