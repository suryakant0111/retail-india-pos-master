import React, { createContext, useContext, ReactNode } from 'react';
import { usePrefetch } from '@/hooks/usePrefetch';

interface PrefetchContextType {
  getPrefetchedData: (route: string) => any;
  isPrefetching: (route: string) => boolean;
  prefetchState: any;
}

const PrefetchContext = createContext<PrefetchContextType>({
  getPrefetchedData: () => null,
  isPrefetching: () => false,
  prefetchState: {}
});

export const usePrefetchContext = () => useContext(PrefetchContext);

interface PrefetchProviderProps {
  children: ReactNode;
}

export const PrefetchProvider: React.FC<PrefetchProviderProps> = ({ children }) => {
  const { getPrefetchedData, isPrefetching, prefetchState } = usePrefetch();

  return (
    <PrefetchContext.Provider value={{
      getPrefetchedData,
      isPrefetching,
      prefetchState
    }}>
      {children}
    </PrefetchContext.Provider>
  );
}; 