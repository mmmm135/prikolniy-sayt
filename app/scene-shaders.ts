export const vertex=`attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
export const fragment=`precision highp float;
varying vec2 uv;
uniform vec2 resolution,pointer;
uniform float progress,time,landing;
uniform sampler2D landscape,wildlife;
float hash(float x){return fract(sin(x*127.13)*43758.54);}
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i.x+i.y*71.),hash(i.x+1.+i.y*71.),f.x),mix(hash(i.x+(i.y+1.)*71.),hash(i.x+1.+(i.y+1.)*71.),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.1+7.)*.28+noise(p*4.2+19.)*.17;}
float cloudMass(vec2 p){
 p+=vec2(sin(time*.19)*.01,sin(time*.23)*.006);
 float body=length((p-vec2(.22,.36))/vec2(.30,.12));
 body=min(body,length((p-vec2(.10,.28))/vec2(.14,.15)));
 body=min(body,length((p-vec2(.26,.20))/vec2(.12,.18)));
 body=min(body,length((p-vec2(.40,.31))/vec2(.12,.13)));
 body=min(body,length((p-vec2(.17,.45))/vec2(.13,.12)));
 body=min(body,length((p-vec2(.37,.43))/vec2(.10,.11)));
 return body+(fbm(p*vec2(19.,24.)+vec2(time*.055,0.))-.5)*.38;
}
vec3 cloudLayer(vec3 base,vec2 p,float spread,float opacity,vec3 paper,vec3 ink,float pitch){
 vec2 c=vec2(floor(p.x*resolution.x/pitch)*pitch/resolution.x,floor(p.y*resolution.y/7.)*7./resolution.y);
 vec2 left=vec2(c.x+spread,c.y-.53);
 vec2 right=vec2(1.-c.x+spread,c.y+.24);
 float d=min(cloudMass(left),cloudMass(right));
 float shape=1.-step(1.,d);
 vec2 field=d==cloudMass(left)?left:right;
 float volume=fbm(field*vec2(11.,15.)+vec2(time*.12,-time*.04));
 float shade=clamp(.16+(field.y-.24)*1.15+(volume-.5)*.9,.05,.94);
 float line=fract(p.x*resolution.x/pitch);
 float cut=step(shade,line)*step(line,.94);
 float chip=step(.035,noise(c*vec2(260.,150.)));
 return mix(base,mix(ink,paper,cut),shape*opacity*chip);
}
void main(){
 vec2 p=vec2(uv.x,1.-uv.y);float aspect=resolution.x/resolution.y;
 vec3 paper=vec3(201.,184.,148.)/255.;vec3 ink=vec3(41.,41.,32.)/255.;
 float pitch=resolution.x>1100.?7.:4.;float col=floor(p.x*resolution.x/pitch);
 float move=ramp(.08,.46,landing);float lake=ramp(.53,.76,landing);
 // One continuous valley. The camera moves through the landscape, never stretching its trees.
 vec2 cover=vec2(min(1.,aspect/1.777),min(1.,1.777/aspect));
 vec2 q=(p-.5)*cover/(1.+move*.15)+vec2(mix(.71,.5,smoothstep(.65,1.1,aspect)),.5+lake*.09);
 float crown=ramp(.47,.8,q.y)*ramp(.13,.32,abs(q.x-.55));
 q.x+=crown*(sin(time*.7+q.y*20.)*.004+sin(time*1.1+q.x*29.)*.002);
 q+=pointer*vec2(.009,.005);
 float horizon=.67;float reflect=ramp(horizon-.005,horizon+.012,p.y)*lake;
 vec2 reflected=q;
 reflected.y=.77-(p.y-horizon)*.62;
 reflected.x+=sin(p.y*96.-time*1.6)*.004+sin(p.y*37.+time*.7)*.003;
 q=mix(q,reflected,reflect);
 q.x=floor(q.x*resolution.x/pitch)*pitch/resolution.x;
 q.y=floor(q.y*resolution.y/3.)*3./resolution.y;
 float density=dot(texture2D(landscape,q).rgb,vec3(.3,.5,.2));
 density=clamp((density-.06)*1.28,0.,1.);
 density=mix(density,1.-density,ramp(.31,.47,landing));
 // The printed image is made from tapered columns, rather than a stripe overlay.
 float etched=(1.-step(density*.93,fract(p.x*resolution.x/pitch)))*step(.035,density);
 // Scroll tears the actual landscape columns away; no opacity transition.
 float departure=ramp(.14+hash(col)*.045,.42+hash(col)*.04,landing);
 vec2 fragmentUV=q;
 fragmentUV.y+=(hash(col)>.5?1.:-1.)*departure*(.45+hash(col)*.8);
 fragmentUV.x+=(hash(col+9.)-.5)*departure*.025;
 float inFrame=step(0.,fragmentUV.y)*step(fragmentUV.y,1.);
 float fragmentInk=clamp((dot(texture2D(landscape,clamp(fragmentUV,0.,1.)).rgb,vec3(.3,.5,.2))-.06)*1.28,0.,1.);
 float fragmentStroke=(1.-step(fragmentInk*.93,fract(p.x*resolution.x/pitch)))*step(.035,fragmentInk);
 float sceneVisibility=1.-step(.45,landing);
 float edges=ramp(.25,.5,abs(p.x-.5));
 float landMask=max(edges*ramp(.28,.55,p.y),ramp(.59,.76,p.y));
 landMask*=1.-ramp(.91,1.03,p.y);
 float surround=landMask*(.48+.52*lake);
 float inkAmount=max(fragmentStroke*(.22+fragmentInk*.78)*inFrame*sceneVisibility,etched*(.22+density*.78)*surround*ramp(.25,.46,landing));
 inkAmount*=mix(1.,.33,reflect);
 vec3 color=mix(paper,ink,inkAmount);
 float spread=ramp(.44,.75,landing)*.43;
 float clouds=ramp(.20,.43,landing);
 if(clouds*(1.-lake)>.001)color=cloudLayer(color,p,spread,clouds*(1.-lake), paper,ink,pitch*1.8);
 if(lake>.001)color=cloudLayer(color,vec2(p.x,p.y+.82),.25,lake*.6,paper,ink,pitch*1.8);
 // Distant atmosphere is deliberately quiet behind the complete wordmark.
 vec2 animalUV=vec2(floor(p.x*resolution.x/pitch)*pitch/resolution.x,floor(p.y*resolution.y/4.)*4./resolution.y);
 vec4 animal=texture2D(wildlife,animalUV);
 float animalStroke=1.-step(.6,fract(p.x*resolution.x/pitch));
 color=mix(color,mix(paper,ink,animalStroke),step(.12,animal.a)*(1.-ramp(.055,.14,landing)));
 color=mix(color,paper,ramp(.79,.998,p.y)*ramp(.71,.8,landing));
 gl_FragColor=vec4(color,1.);
}`;
