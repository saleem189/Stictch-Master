import { useState } from 'react';
import { joinClasses } from './classNames';

interface AtelierImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  aspect?: string;
  priority?: boolean;
}

export default function AtelierImage({ src, alt, className, imageClassName, aspect = 'aspect-[4/3]', priority = false }: AtelierImageProps) {
  const [loaded, setLoaded] = useState(false);
  return <div className={joinClasses('relative overflow-hidden bg-atelier-ivory', aspect, className)}>
    <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-br from-atelier-ivory via-white to-atelier-brass/10" />
    <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onLoad={() => setLoaded(true)} className={joinClasses('absolute inset-0 h-full w-full object-cover transition duration-700', loaded ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0 blur-sm', imageClassName)} />
  </div>;
}
