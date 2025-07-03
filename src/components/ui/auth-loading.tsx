"use client";

import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        {/* Shadcn Loading Spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        
        {/* Loading Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Authenticating...
          </p>
        </div>
      </div>
    </div>
  );
} 