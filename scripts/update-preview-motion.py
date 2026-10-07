from pathlib import Path
for slug in ['little-loaf','sweet-blissful-blooms','little-local','down-home-roots','curly-and-spot']:
 path=Path('public/concepts')/(slug+'.html');s=path.read_text(encoding='utf8')
 s=s.replace('photo-breathe 14s','photo-breathe 9s')
 s=s.replace("document.body.classList.add('preview');", "document.body.classList.add('preview','preview-paused');")
 if 'scale:calc(1.08' not in s:s=s.replace('</style>', '.preview .hero img{scale:calc(1.08 - var(--preview-progress,0)*.08)}</style>',1)
 if "--preview-progress',e.data.progress" not in s:s=s.replace("document.body.classList.toggle('preview-paused',!e.data.active)", "{document.body.classList.toggle('preview-paused',!e.data.active);if(typeof e.data.progress==='number')document.body.style.setProperty('--preview-progress',e.data.progress)}")
 path.write_text(s,encoding='utf8')
