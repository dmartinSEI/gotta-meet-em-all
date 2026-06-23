"use client";

import { useRouter } from "next/navigation";

export default function BackLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-xs font-medium transition-colors"
      style={{ color: "rgba(45,27,78,0.40)" }}
    >
      ← Back
    </button>
  );
}
