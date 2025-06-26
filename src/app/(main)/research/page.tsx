"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

export default function ResearchPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/research/collections");
  }, [router]);

  return null;
}
