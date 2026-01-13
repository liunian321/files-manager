import { FileIcon as DefaultIcon, Video, Music, Image as ImageIcon, FileText } from 'lucide-react';

interface FileIconProps {
  type: string;
  className?: string;
}

export default function FileIcon({ type, className }: FileIconProps) {
  if (type.startsWith('image/'))
    return <ImageIcon className={className || 'h-5 w-5 text-blue-500'} />;
  if (type.startsWith('video/'))
    return <Video className={className || 'h-5 w-5 text-purple-500'} />;
  if (type.startsWith('audio/')) return <Music className={className || 'h-5 w-5 text-pink-500'} />;
  if (type.includes('pdf') || type.includes('text'))
    return <FileText className={className || 'h-5 w-5 text-orange-500'} />;
  return <DefaultIcon className={className || 'h-5 w-5 text-zinc-500'} />;
}
