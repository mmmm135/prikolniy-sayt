"""Keep filmed animal contours instead of guessing a silhouette from fur colours."""
import sys
sys.path.insert(0, 'work/matte-python')
import numpy as np
import onnxruntime as ort
from PIL import Image
from pathlib import Path
import subprocess

def largest_subject(piece):
 # Discard disconnected background animals; retain the filmed subject's soft edge.
 binary=piece>110;seen=np.zeros(binary.shape,dtype=bool);height,width=binary.shape;largest=[]
 for y,x in zip(*np.where(binary)):
  if seen[y,x]:continue
  stack=[(int(y),int(x))];seen[y,x]=True;component=[]
  while stack:
   yy,xx=stack.pop();component.append((yy,xx))
   for ny,nx in [(yy-1,xx),(yy+1,xx),(yy,xx-1),(yy,xx+1)]:
    if 0<=ny<height and 0<=nx<width and binary[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;stack.append((ny,nx))
  if len(component)>len(largest):largest=component
 keep=np.zeros(binary.shape,dtype=bool)
 for y,x in largest:keep[y,x]=True
 padded=np.pad(keep,2)
 halo=np.zeros_like(keep)
 for dy in range(5):
  for dx in range(5):halo|=padded[dy:dy+height,dx:dx+width]
 return np.where(halo,piece,0).astype('uint8')

options=ort.SessionOptions(); options.intra_op_num_threads=4
session=ort.InferenceSession('work/matte-models/u2netp.onnx',options,providers=['CPUExecutionProvider'])
def infer(image):
 a=np.asarray(image.resize((320,320)),dtype=np.float32)/255
 a=(a-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)
 prediction=session.run(None,{'input.1':a.transpose(2,0,1)[None]})[0][0,0]
 prediction=(prediction-prediction.min())/(prediction.max()-prediction.min()+1e-8)
 return Image.fromarray((prediction*255).astype('uint8')).resize(image.size,Image.Resampling.LANCZOS)

def mask(image):
 # Separate crops preserve thin antlers and legs that a whole-herd thumbnail loses.
 result=np.zeros((image.height,image.width),dtype=np.uint8)
 for x0,y0,x1,y1 in [(345,25,510,250),(475,60,655,280),(605,30,810,315),(865,100,1165,350)]:
  piece=largest_subject(np.asarray(infer(image.crop((x0,y0,x1,y1)))))
  result[y0:y1,x0:x1]=np.maximum(result[y0:y1,x0:x1],piece)
 return Image.fromarray(result)

first=Image.open('herd-cropped.jpg').convert('RGB')
firstMask=mask(first); firstMask.save('work/herd-matte-check.png')
cut=first.convert('RGBA');cut.putalpha(firstMask);cut.save('work/herd-cutout-check.png')
if '--all' in sys.argv:
 folder=Path('work/herd-frames');folder.mkdir(exist_ok=True)
 subprocess.run(['ffmpeg','-y','-i','work/sources/work-new-herd-source.mp4','-vf','trim=end=4,crop=1920:540:0:340,scale=1280:-2,fps=24',str(folder/'source-%03d.png')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 for index,path in enumerate(sorted(folder.glob('source-*.png'))):
  image=Image.open(path).convert('RGB');alpha=mask(image)
  packed=Image.new('RGB',(image.width*2,image.height));packed.paste(image,(0,0));packed.paste(alpha.convert('RGB'),(image.width,0));packed.save(folder/f'packed-{index:03d}.png')
  if index%12==0:print('Prepared',index,flush=True)
