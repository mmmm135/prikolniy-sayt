import Image from 'next/image';
export default function LoadingButterfly(){
 return <div className="loading-butterfly-motion" aria-hidden="true"><Image className="loading-butterfly-filmstrip" src="/art/loading-butterfly-filmstrip.webp" width={288} height={15360} alt="" unoptimized priority/></div>;
}
