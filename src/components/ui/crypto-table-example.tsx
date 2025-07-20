"use client";

import React from "react";
import { CryptoTable } from "./crypto-table";
import type { CryptoData } from "./crypto-table";

export function CryptoTableExample() {
  const handleRowClick = (crypto: CryptoData) => {
    console.log("Clicked on:", crypto.name);
    // Handle row click - could navigate, show modal, etc.
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Cryptocurrency Table</h1>
      <CryptoTable 
        onRowClick={handleRowClick}
        className="mx-auto max-w-4xl"
      />
    </div>
  );
}

export default CryptoTableExample;