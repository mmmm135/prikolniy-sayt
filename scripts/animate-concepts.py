from pathlib import Path
css='''
/* Motion belongs to the actual page, so its carousel preview is alive too. */
.hero figure{overflow:hidden}.hero img{animation:photo-breathe 14s ease-in-out infinite alternate;will-change:transform}
.copy>.label{display:inline-block;animation:copy-enter .9s both}.copy h1{animation:copy-enter 1.2s .14s both}.copy p{animation:copy-enter 1s .3s both}.copy>.pill{animation:copy-enter 1s .46s both}
nav{animation:nav-enter .9s both}.pill{transition:transform .3s,box-shadow .3s}.pill:hover{transform:translateY(-3px);box-shadow:0 9px 22px #0002}
.motion-reveal{opacity:0;transform:translateY(24px);transition:opacity .9s,transform .9s}.motion-reveal.in-view{opacity:1;transform:none}
.preview .demo{display:none}.preview .hero{min-height:700px}.preview .motion-reveal{opacity:1;transform:none}.preview-paused *, .preview-paused *::before,.preview-paused *::after{animation-play-state:paused!important}
@keyframes copy-enter{from{opacity:0;transform:translateY(28px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes nav-enter{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes photo-breathe{from{transform:scale(1.03) translateY(0)}to{transform:scale(1.105) translateY(-2%)}}
@keyframes stamp-rock{from{transform:rotate(-8deg)}to{transform:rotate(6deg)}}
@keyframes band-drift{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
@keyframes word-hop{0%,75%,100%{transform:translateY(0)}82%{transform:translateY(-9px)}90%{transform:translateY(2px)}}
.stamp{animation:stamp-rock 8s ease-in-out infinite alternate}.season{animation:band-drift 9s ease-in-out infinite alternate}.coffee-bar span{animation:band-drift 7s ease-in-out infinite alternate}.coffee-bar span:nth-child(2){animation-direction:alternate-reverse}.treat-band span{display:inline-block;animation:word-hop 5s infinite}.treat-band span:nth-child(2){animation-delay:.2s}.treat-band span:nth-child(3){animation-delay:.4s}.treat-band span:nth-child(4){animation-delay:.6s}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.motion-reveal{opacity:1;transform:none}}
'''
script='''<script>
if(new URLSearchParams(location.search).has('preview'))document.body.classList.add('preview');
const motionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');motionObserver.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.collection header,.product,.story h2,.story>div,.contact').forEach((e,i)=>{e.classList.add('motion-reveal');e.style.transitionDelay=(i%3)*.08+'s';motionObserver.observe(e)});
addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='preview-active')document.body.classList.toggle('preview-paused',!e.data.active)});
</script>'''
for p in Path('public/concepts').glob('*.html'):
 s=p.read_text(encoding='utf8')
 if 'photo-breathe' in s:continue
 s=s.replace('</style>',css+'</style>').replace('</body>',script+'</body>')
 s=s.replace('font-size:100px;font-weight:800','font-size:clamp(62px,7vw,100px);font-weight:800')
 p.write_text(s,encoding='utf8')
