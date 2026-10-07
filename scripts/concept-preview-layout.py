from pathlib import Path
css='''.preview main>:not(.hero){display:none}.preview footer{display:none}.preview .hero{height:calc(100vh - 80px)!important;min-height:calc(100vh - 80px)!important;align-items:center}.preview .hero figure{height:100%!important}.preview .hero .copy{align-self:center;padding-top:0!important;padding-bottom:0!important}.preview .hero p{font-size:17px}.preview nav{padding:22px 5%}.preview .hero h1{font-size:clamp(74px,8vw,110px)}'''
for p in Path('public/concepts').glob('*.html'):
 s=p.read_text(encoding='utf8');s=s.replace('</style>',css+'</style>');p.write_text(s,encoding='utf8')
