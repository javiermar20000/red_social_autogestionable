import { cn } from '../lib/cn.js';

const MasonryGrid = ({ children, className = '' }) => {
  return (
    <div className={cn('columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4', className)}>
      {children}
    </div>
  );
};

export default MasonryGrid;
