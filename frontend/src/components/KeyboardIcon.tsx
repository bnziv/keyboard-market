import type React from "react";

interface KeyboardIconProps {
  className?: string;
}

export const KeyboardIcon: React.FC<KeyboardIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="10 10 220 97"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="220" height="96" rx="10" fill="currentColor" />

      <rect x="20" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="40" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="60" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="80" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="100" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="120" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="140" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="160" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="180" y="20" width="15" height="15" rx="2" fill="white" />
      <rect x="200" y="20" width="15" height="15" rx="2" fill="white" />

      <rect x="30" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="50" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="70" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="90" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="110" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="130" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="150" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="170" y="40" width="15" height="15" rx="2" fill="white" />
      <rect x="190" y="40" width="15" height="15" rx="2" fill="white" />

      <rect x="40" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="60" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="80" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="100" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="120" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="140" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="160" y="60" width="15" height="15" rx="2" fill="white" />
      <rect x="180" y="60" width="15" height="15" rx="2" fill="white" />

      <rect x="60" y="80" width="115" height="15" rx="2" fill="white" />
    </svg>
  );
};
