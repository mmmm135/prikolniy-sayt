import sys
sys.path.insert(0,'work/matte-python')
import cv2,numpy as np
from pathlib import Path
folder=Path('work/herd-stable');out=Path('work/herd-refined');out.mkdir(exist_ok=True)
for i,path in enumerate(sorted(folder.glob('packed-*.png'))):
 packed=cv2.imread(str(path));image=packed[:,:1280];alpha=packed[:,1280:,0]/255
 labels=np.full(alpha.shape,cv2.GC_BGD,np.uint8)
 labels[alpha>.07]=cv2.GC_PR_BGD;labels[alpha>.23]=cv2.GC_PR_FGD;labels[alpha>.8]=cv2.GC_FGD
 bg=np.zeros((1,65),np.float64);fg=np.zeros((1,65),np.float64)
 cv2.grabCut(image,labels,None,bg,fg,2,cv2.GC_INIT_WITH_MASK)
 matte=np.where((labels==cv2.GC_PR_FGD)|(labels==cv2.GC_FGD),255,0).astype(np.uint8)
 matte=cv2.GaussianBlur(matte,(3,3),.45)
 packed[:,1280:]=cv2.cvtColor(matte,cv2.COLOR_GRAY2BGR)
 cv2.imwrite(str(out/path.name),packed)
 if i==0:cv2.imwrite('work/herd-refined-check.png',cv2.cvtColor(matte,cv2.COLOR_GRAY2BGR))
 if i%24==0:print('Refined',i,flush=True)
