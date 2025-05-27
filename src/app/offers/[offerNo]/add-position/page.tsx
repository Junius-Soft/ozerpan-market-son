"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AddPositionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("add-position/select-product");
  }, [router]);

  return null; // Just redirect and render nothing
}
