import React, { useEffect, useState } from 'react';
import { getFileFromLocal } from '../lib/fileStorage';

interface FileImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackText?: string;
  fallbackClassName?: string;
  alt?: string;
  className?: string;
}

export default function FileImage({ src, fallbackText, fallbackClassName, className, alt, ...props }: FileImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (src && src.startsWith('file_')) {
      getFileFromLocal(src).then(data => {
        if (isMounted && data) {
          setDataUrl(data);
        }
      });
    } else if (src) {
      setDataUrl(src);
    } else {
      setDataUrl(null);
    }
    return () => { isMounted = false; };
  }, [src]);

  if (dataUrl) {
    return <img src={dataUrl} alt={alt} className={className} {...props} />;
  }

  return (
    <div className={fallbackClassName || "w-10 h-10 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-600"}>
      {fallbackText || '?'}
    </div>
  );
}