import { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
}

const MasonryGrid = ({ children }: MasonryGridProps) => {
  return (
    <div className="container px-4 py-6">
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
        {children}
      </div>
    </div>
  );
};

export default MasonryGrid;
