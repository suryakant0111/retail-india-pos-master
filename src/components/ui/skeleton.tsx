// src/components/ui/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, style = {} }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ width, height, ...style }}
  />
);

export { Skeleton };
