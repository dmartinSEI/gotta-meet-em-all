"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function PhotoUpload({ currentUrl }: { currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError("");
    setUploading(true);
    const local = URL.createObjectURL(file);
    setPreview(local);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setPreview(json.url);
      URL.revokeObjectURL(local);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPreview(currentUrl ?? null);
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

  const initials = "";

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <div
        className="relative shrink-0 w-20 h-20 rounded-full overflow-hidden cursor-pointer"
        style={{ border: "2px solid rgba(45,27,78,0.12)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <Image src={preview} alt="Profile photo" fill sizes="80px" className="object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-[#2D1B4E] flex items-center justify-center">
            <span className="text-white/50 text-2xl">?</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/50 ${
            dragging ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          {uploading ? (
            <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M14.243 5.757a6 6 0 10-8.486 8.486L10 18.506l4.243-4.263a6 6 0 000-8.486zM10 12a2 2 0 110-4 2 2 0 010 4z" />
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v.01A7.002 7.002 0 0117 10a1 1 0 11-2 0 5 5 0 00-5-5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2D1B4E] mb-0.5">Profile photo</p>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.45)" }}>
          Used on your card in others&apos; collections. JPG or PNG, max 5 MB.
        </p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ background: "#C8102E", color: "#fff" }}
        >
          {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
        </button>
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />
    </div>
  );
}
