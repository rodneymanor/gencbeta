import React from "react";

interface GenCLogoProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  textSize?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const textSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function GenCLogo({ 
  className = "", 
  iconSize = "md", 
  textSize = "md", 
  showText = true 
}: GenCLogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className="p-2 rounded-lg shadow-lg" style={{ backgroundColor: "#1e9df1" }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={iconSizes[iconSize]} 
          viewBox="0 0 24 24"
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="cameraGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "rgb(255,255,255)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "rgb(224,224,224)", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Camera Path with Gradient Fill */}
          <path 
            fill="url(#cameraGradient)" 
            d="M18 6.0917C18.4714 6.0917 18.9228 6.27976 19.2628 6.61983C19.6029 6.9599 19.7909 7.41129 19.7909 7.88261V16.1174C19.7909 16.5887 19.6029 17.0401 19.2628 17.3802C18.9228 17.7202 18.4714 17.9083 18 17.9083H6C5.52862 17.9083 5.07724 17.7202 4.73718 17.3802C4.39711 17.0401 4.20905 16.5887 4.20905 16.1174V7.88261C4.20905 7.41129 4.39711 6.9599 4.73718 6.61983C5.07724 6.27976 5.52862 6.0917 6 6.0917H18ZM18 4H6C4.93913 4 3.92172 4.42143 3.17157 5.17157C2.42143 5.92172 2 6.93913 2 8V16C2 17.0609 2.42143 18.0783 3.17157 18.8284C3.92172 19.5786 4.93913 20 6 20H18C19.0609 20 20.0783 19.5786 20.8284 18.8284C21.5786 18.0783 22 17.0609 22 16V8C22 6.93913 21.5786 5.92172 20.8284 5.17157C20.0783 4.42143 19.0609 4 18 4Z" 
          />
          
          {/* Script Lines */}
          <g fill="white">
            <rect x="7" y="9" width="10" height="1" rx="0.5" />
            <rect x="7" y="11.5" width="10" height="1" rx="0.5" />
            <rect x="7" y="14" width="7" height="1" rx="0.5" />
          </g>
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <h1 className={`${textSizes[textSize]} font-bold text-foreground tracking-tighter`}>
          Gen C
        </h1>
      )}
    </div>
  );
}

export function GenCIcon({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return <GenCLogo className={className} iconSize={size} showText={false} />;
} 