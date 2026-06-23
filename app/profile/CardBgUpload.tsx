"use client";

import { useRef, useState } from "react";
import { officeImageSrc } from "@/lib/cards";

export default function CardBgUpload({
  currentUrl,
  office,
}: {
  currentUrl: string | null;
  office: string | null;
}) {
  const defaultBg = officeImageSrc(office);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBg = preview ?? defaultBg;
  const hasCustom = preview !== null;

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Image must be under 5 MB."); return; }
    setError("");
    setUploading(true);
    const local = URL.createObjectURL(file);
    setPreview(local);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload-card-bg", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setPreview(json.url);
      URL.revokeObjectURL(local);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="flex items-center gap-5">
      {/* Card-shaped preview */}
      <div
        className="relative shrink-0 cursor-pointer rounded-xl overflow-hidden"
        style={{
          width: 72, height: 96,
          border: dragging ? "2px solid #C8102E" : "2px solid rgba(45,27,78,0.12)",
          background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
          ...(activeBg ? {
            backgroundImage: `url(${activeBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : {}),
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/50 ${dragging ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
          {uploading ? (
            <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2D1B4E] mb-0.5">Card background</p>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.45)" }}>
          {hasCustom
            ? "Custom background active — upload a new image to replace it."
            : "Defaults to your office image. Upload to personalize your card."}
        </p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ background: "#C8102E", color: "#fff" }}
        >
          {uploading ? "Uploading…" : hasCustom ? "Change background" : "Upload background"}
        </button>
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
    </div>
  );
}
