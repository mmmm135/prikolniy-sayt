# Source: https://mixkit.co/free-stock-video/black-and-red-butterfly-fluttering-on-a-flower-4088/
# Mixkit Stock Video Free License. Keep only the stable perched segment (1.8–3.6 seconds) before takeoff.
import cv2,numpy as np,subprocess,imageio_ffmpeg
from pathlib import Path
root=Path('work/loading-butterfly');root.mkdir(parents=True,exist_ok=True)
if not (root/'source.mp4').exists():
 import urllib.request
 urllib.request.urlretrieve('https://assets.mixkit.co/videos/4088/4088-720.mp4',root/'source.mp4')
cap=cv2.VideoCapture(str(root/'source.mp4'));frames=[]
for i in range(45,91,1):
 cap.set(cv2.CAP_PROP_POS_FRAMES,i);ok,f=cap.read();f=cv2.resize(f,(640,360));hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV);y,x=np.indices((360,640));region=np.zeros((360,640),np.uint8)
 cv2.fillPoly(region,[np.array([[187,65],[250,4],[510,4],[540,125],[445,240],[350,276],[305,300],[252,310],[181,272],[183,200]])],1)
 mask=np.where(region>0,cv2.GC_PR_FGD,cv2.GC_BGD).astype(np.uint8)
 green=(hsv[:,:,0]>27)&(hsv[:,:,0]<100)&(hsv[:,:,1]>55)&(hsv[:,:,2]>65)
 mask[green]=cv2.GC_BGD
 dark=(hsv[:,:,2]<65)&(region>0)&(x>255)&(y<220)
 mask[dark]=cv2.GC_FGD
 petals=((hsv[:,:,0]<27)|(hsv[:,:,0]>165))&(hsv[:,:,1]>90)&(hsv[:,:,2]>75)&(region>0)
 mask[petals]=cv2.GC_FGD
 cv2.grabCut(f,mask,None,np.zeros((1,65)),np.zeros((1,65)),3,cv2.GC_INIT_WITH_MASK)
 keep=(mask==1)|(mask==3)
 # Clip grey/green background spill around the blurred upper wing.
 keep &= (hsv[:,:,2]<58)|(hsv[:,:,0]<25)|(hsv[:,:,0]>165)|((hsv[:,:,1]<110)&(x>310))
 keep[(y<105)&(x<260)]=False
 keep[(y<90)&(x<310)&(hsv[:,:,2]>45)]=False
 antenna=np.zeros((360,640),np.uint8);cv2.polylines(antenna,[np.array([[191,70],[195,82],[218,95],[247,108],[264,115]])],False,1,2)
 keep|=(antenna>0)&(hsv[:,:,2]<90)
 keep[y>290]=False
 # Keep the flower's central stem, without its surrounding leaves.
 stem=np.zeros((360,640),np.uint8);cv2.fillPoly(stem,[np.array([[271,274],[293,273],[287,301],[272,334],[272,356],[266,356],[267,330],[280,299]])],1)
 keep|=(stem>0)&(hsv[:,:,0]>27)&(hsv[:,:,0]<100)
 gray=cv2.cvtColor(f,cv2.COLOR_BGR2GRAY)/255
 wing_weight=np.clip(np.maximum((x-330)/35,(215-y)/25),0,1)
 density=(.4+gray*.6)*(1-wing_weight)+np.clip(1.05-gray*1.65,.22,1)*wing_weight
 density*=cv2.GaussianBlur(keep.astype(np.float32),(3,3),.5)
 density=(np.clip(density,0,1)*255).astype(np.uint8)
 # Portrait framing around the isolated subject.
 density=cv2.copyMakeBorder(density[:,155:565],24,24,24,24,cv2.BORDER_CONSTANT,value=0);frames.append(density)
 if i==45:cv2.imwrite('public/art/loading-butterfly-poster.png',density)
for k,f in enumerate(frames+frames[-2:0:-1]):cv2.imwrite(str(root/f'density-{k:03}.png'),f)
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-framerate','25','-i',str(root/'density-%03d.png'),'-frames:v',str(len(frames)*2-2),'-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','public/art/loading-butterfly.mp4'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print('prepared',len(frames)*2-2,'frames',Path('public/art/loading-butterfly.mp4').stat().st_size)
