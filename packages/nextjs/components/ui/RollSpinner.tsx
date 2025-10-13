import React from "react";

export const RollSpinner: React.FC<{ size?: number; color?: string }> = ({
  size = 64,
  color = "#7c3aed", // ungu Tailwind default purple-600
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${size / 8}px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
  );
};
