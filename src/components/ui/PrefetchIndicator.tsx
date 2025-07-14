import React from 'react';
import { usePrefetchContext } from '@/contexts/PrefetchContext';
import { Loader2 } from 'lucide-react';

interface PrefetchIndicatorProps {
  route: string;
  className?: string;
}

export const PrefetchIndicator: React.FC<PrefetchIndicatorProps> = ({ route, className = '' }) => {
  const { isPrefetching } = usePrefetchContext();
  const isPrefetchingRoute = isPrefetching(route);

  if (!isPrefetchingRoute) return null;

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Loading...</span>
    </div>
  );
}; 