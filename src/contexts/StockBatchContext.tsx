import React, { createContext, useContext, useState } from 'react';
import { StockAdjustment } from '@/types';

interface StockBatchContextType {
  stockBatches: StockAdjustment[];
  setStockBatches: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
}

const StockBatchContext = createContext<StockBatchContextType | undefined>(undefined);

export const StockBatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockBatches, setStockBatches] = useState<StockAdjustment[]>([]);
  return (
    <StockBatchContext.Provider value={{ stockBatches, setStockBatches }}>
      {children}
    </StockBatchContext.Provider>
  );
};

export const useStockBatches = () => {
  const ctx = useContext(StockBatchContext);
  if (!ctx) throw new Error('useStockBatches must be used within a StockBatchProvider');
  return ctx;
}; 