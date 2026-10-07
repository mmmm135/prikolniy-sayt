import * as THREE from 'three';

// A continuous, articulated laurel bough: every leaf is attached to a petiole,
// and every pose is a pure function of scroll position (including reverse scroll).
export function createWorkBranch() {
 const scene = new THREE.Scene();
 const root = new THREE.Group(); scene.add(root);
 const wood = new THREE.ShaderMaterial({
  vertexShader:`varying vec3 barkPosition;varying vec3 barkNormal;
   void main(){barkPosition=position;barkNormal=normalize(normalMatrix*normal);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 barkPosition;varying vec3 barkNormal;
   void main(){float light=abs(dot(normalize(barkNormal),normalize(vec3(-.4,.7,1.))));
    float grain=sin(barkPosition.y*81.+sin(barkPosition.x*129.)*2.)*.045;
    gl_FragColor=vec4(vec3(.62+light*.18+grain),1.);}`,
 });
 const geometries:THREE.BufferGeometry[] = [], materials:THREE.Material[] = [wood];
 const stemPaths = [
  [[.04,.13,0],[-.10,-.26,.025],[-.04,-.72,.04],[-.32,-1.13,0],[-.61,-1.50,.04]],
  [[-.05,-.47,.02],[-.28,-.63,.07],[-.64,-.68,.13],[-.90,-.91,.06]],
  [[-.18,-.95,.02],[.09,-1.06,-.05],[.21,-1.31,-.04],[.13,-1.52,-.02]],
 ];
 const paths = stemPaths.map(points=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))));
 const tubes = paths.map((path,i)=>{
  const geometry = new THREE.TubeGeometry(path,64,i===0?.026:.010,7,false);
  geometries.push(geometry);
  const pos=geometry.getAttribute('position'), original=new Float32Array(pos.array);
  // Taper the radius to a young twig; TubeGeometry's constant radius is too artificial.
  for(let ring=0;ring<=64;ring++) {
   const center=path.getPointAt(ring/64), taper=1-Math.pow(ring/64,.7)*.90;
   for(let j=0;j<8;j++) {
    const index=(ring*8+j)*3;
    original[index]=center.x+(original[index]-center.x)*taper;
    original[index+1]=center.y+(original[index+1]-center.y)*taper;
    original[index+2]=center.z+(original[index+2]-center.z)*taper;
   }
  }
  const mesh=new THREE.Mesh(geometry,wood);root.add(mesh);
  return {geometry,original};
 });
 const segments=30, across=8, vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
 for(let row=0;row<=segments;row++) {
  const t=row/segments;
  const width=Math.pow(Math.sin(Math.PI*t),.82)*.235*(1-.25*t);
  for(let col=0;col<=across;col++) {
   const s=col/across*2-1;
   vertices.push(s*width,t,Math.sin(t*Math.PI)*.035+(1-s*s)*.025);
   uvs.push(col/across,t);
  }
 }
 for(let row=0;row<segments;row++)for(let col=0;col<across;col++) {
  const a=row*(across+1)+col,b=a+across+1;
  indices.push(a,b,a+1,a+1,b,b+1);
 }
 const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 blade.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));blade.setIndex(indices);blade.computeVertexNormals();geometries.push(blade);
 const petiole=new THREE.CylinderGeometry(.005,.007,.10,6);petiole.translate(0,.05,0);geometries.push(petiole);
 const leaves:{group:THREE.Group;material:THREE.ShaderMaterial;path:number;at:number;side:number;length:number;seed:number}[]=[];
 paths.forEach((_,path)=>{
  const count=path===0?9:5;
  for(let j=0;j<count;j++) {
   const seed=(j*1.618+path*.79)%1, side=j%2===0?-1:1;
   const at=.20+j/(count-1)*.73, length=.28+seed*.10-(at>.8?.04:0);
   const material=new THREE.ShaderMaterial({side:THREE.DoubleSide,
    uniforms:{fold:{value:1},shade:{value:.12+seed*.14}},
    vertexShader:`varying vec2 leafUV;varying vec3 leafNormal;uniform float fold;
     void main(){leafUV=uv;vec3 p=position;
      p.x*=1.-fold*.84;p.z+=abs(position.x)*fold*1.1+pow(p.y,2.)*fold*.26;
      leafNormal=normalize(normalMatrix*vec3(normal.x,normal.y-fold*.5,normal.z));
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying vec2 leafUV;varying vec3 leafNormal;uniform float shade;
     void main(){vec2 q=leafUV;float center=abs(q.x-.5);
      float rib=1.-smoothstep(.005,.018,center);
      float vein=1.-smoothstep(.025,.065,abs(fract(q.y*11.-center*4.)-.5));
      vein*=smoothstep(.02,.12,center)*(1.-smoothstep(.40,.49,center));
      float light=.5+.5*abs(dot(normalize(leafNormal),normalize(vec3(-.4,.7,1.))));
      float texture=sin(q.y*78.+q.x*22.)*sin(q.x*37.-q.y*14.)*.025;
      float value=clamp(.19+light*.30+shade+rib*.23+vein*.11+texture,.25,.88);
      gl_FragColor=vec4(vec3(value),1.);}`,
   });materials.push(material);
   const group=new THREE.Group(), mesh=new THREE.Mesh(blade,material);
   mesh.position.y=.085;mesh.scale.setScalar(length);
   group.add(new THREE.Mesh(petiole,wood),mesh);root.add(group);
   leaves.push({group,material,path,at,side,length,seed});
  }
 });
 const smooth=(a:number,b:number,v:number)=>THREE.MathUtils.smoothstep(v,a,b);
 const deform=(p:THREE.Vector3,progress:number)=>{
  const distance=Math.min(1.6,Math.max(0,-p.y))/1.6;
  p.x+=distance*distance*(.15*Math.sin(progress*Math.PI*1.7)-.09);
  p.z+=distance*.12*Math.sin(progress*Math.PI*1.4);
  return p;
 };
 const pose=(progress:number)=>{
  tubes.forEach(({geometry,original})=>{
   const position=geometry.getAttribute('position'),p=new THREE.Vector3();
   for(let i=0;i<position.count;i++) {
    p.fromArray(original,i*3);deform(p,progress);position.setXYZ(i,p.x,p.y,p.z);
   }
   position.needsUpdate=true;geometry.computeVertexNormals();
  });
  leaves.forEach(leaf=>{
   const {group,path,at,side,seed}=leaf;
   const openness=smooth(.03+at*.25,.34+at*.34,progress);
   group.position.copy(deform(paths[path].getPointAt(at),progress));
   // Young folded blades turn outward at their own nodes, never as a rigid sprite.
   group.rotation.set(.25+seed*.7+(1-openness)*.75,
    side*(.35+progress*.50+seed*.45),
    side*(.20+openness*(.82+seed*.35))+(path===1?.45:path===2?-.25:0)+Math.sin(progress*5+seed*3)*.065);
   group.scale.setScalar(.22+openness*.78);
   leaf.material.uniforms.fold.value=1-openness;
  });
  root.rotation.z=-.10+progress*.18;
  root.rotation.y=-.15+progress*.30;
 };
 let previous=-1;
 const draw=(progress:number,width:number,height:number)=>{
  if(progress!==previous){pose(progress);previous=progress;}
  const mobile=width<=700,scale=Math.min(height*(mobile?.32:.43),width*(mobile?.63:.30));
  root.scale.setScalar(scale);
  root.position.set(width*.475,height*.50,0);
 };
 const dispose=()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());};
 return {scene,draw,dispose};
}
