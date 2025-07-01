"use client";

export default function AuthLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6">
        {/* Gen C Logo with Animation */}
        <div className="p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24">
            {/* Static Camera Body */}
            <path 
              fill="hsl(var(--foreground))" 
              d="M18 4H6C4.93913 4 3.92172 4.42143 3.17157 5.17157C2.42143 5.92172 2 6.93913 2 8V16C2 17.0609 2.42143 18.0783 3.17157 18.8284C3.92172 19.5786 4.93913 20 6 20H18C19.0609 20 20.0783 19.5786 20.8284 18.8284C21.5786 18.0783 22 17.0609 22 16V8C22 6.93913 21.5786 5.92172 20.8284 5.17157C20.0783 4.42143 19.0609 4 18 4Z" 
            />
            
            {/* Animated Script Lines */}
            <g fill="hsl(var(--background))">
              <rect 
                className="script-line-1" 
                x="7" 
                y="9" 
                width="10" 
                height="1.5" 
                rx="0.5"
              />
              <rect 
                className="script-line-2" 
                x="7" 
                y="11.5" 
                width="10" 
                height="1.5" 
                rx="0.5"
              />
              <rect 
                className="script-line-3" 
                x="7" 
                y="14" 
                width="7" 
                height="1.5" 
                rx="0.5"
              />
            </g>
          </svg>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Defines the fade-in animation for the script lines */
        @keyframes line-fade-in {
          0% {
            opacity: 0;
          }
          33%, 100% {
            opacity: 1;
          }
        }

        /* Applies the animation to all script lines */
        .script-line-1,
        .script-line-2,
        .script-line-3 {
          animation-name: line-fade-in;
          animation-duration: 1.8s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          opacity: 0;
        }

        /* Stagger the start of the animation for each line */
        .script-line-1 { animation-delay: 0s; }
        .script-line-2 { animation-delay: 0.3s; }
        .script-line-3 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
} 