import React from "react";

export const GridBackground: React.FC<{ gridSize: number; height: string }> = ({ gridSize, height }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.05]"
      style={{
        backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        height: height
      }}
    />
  );
};
