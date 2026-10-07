from pathlib import Path
import subprocess
exec(Path('scripts/prepare-herd-matte.py').read_text().split('first=')[0])
folder=Path('work/branch-frames');folder.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-y','-i','work/sources/work-autumn-source.mp4','-vf','trim=end=4,scale=960:-2,fps=24',str(folder/'source-%03d.png')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
for index,path in enumerate(sorted(folder.glob('source-*.png'))):
 image=Image.open(path).convert('RGB');alpha=infer(image)
 packed=Image.new('RGB',(image.width*2,image.height));packed.paste(image,(0,0));packed.paste(alpha.convert('RGB'),(image.width,0));packed.save(folder/f'packed-{index:03d}.png')
 if index%24==0:print('Branch frame',index,flush=True)
