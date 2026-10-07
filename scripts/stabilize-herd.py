from pathlib import Path
exec(Path('scripts/prepare-herd-matte.py').read_text().split('first=')[0])
import cv2
folder=Path('work/herd-stable');folder.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-y','-i','work/sources/work-new-herd-source.mp4','-vf','trim=end=7,crop=1920:540:0:340,scale=1280:-2,fps=24',str(folder/'source-%03d.png')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
previous=None;last_gray=None
for index,path in enumerate(sorted(folder.glob('source-*.png'))):
 image=Image.open(path).convert('RGB');gray=cv2.cvtColor(np.asarray(image),cv2.COLOR_RGB2GRAY)
 current=np.asarray(mask(image),dtype=np.float32)/255
 if previous is not None:
  flow=cv2.calcOpticalFlowFarneback(gray,last_gray,None,.5,3,21,3,5,1.2,0)
  yy,xx=np.mgrid[:gray.shape[0],:gray.shape[1]].astype(np.float32)
  tracked=cv2.remap(previous,xx+flow[:,:,0],yy+flow[:,:,1],cv2.INTER_LINEAR)
  current=current*.28+tracked*.72
 current=cv2.GaussianBlur(current,(3,3),.65)
 previous=current;last_gray=gray
 alpha=Image.fromarray(np.clip(current*255,0,255).astype('uint8'))
 packed=Image.new('RGB',(image.width*2,image.height));packed.paste(image,(0,0));packed.paste(alpha.convert('RGB'),(image.width,0));packed.save(folder/f'packed-{index:03d}.png')
 if index%24==0:print('Stabilized',index,flush=True)
