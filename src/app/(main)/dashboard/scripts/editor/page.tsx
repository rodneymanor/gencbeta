"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ScriptEditorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to the new editor location with all query parameters
    const params = new URLSearchParams(searchParams.toString());
    const newUrl = `/editor/scripts?${params.toString()}`;
    router.replace(newUrl);
  }, [router, searchParams]);

  return (
    <div className="center-column">
      <div className="section">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to editor...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
