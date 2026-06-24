"use client";

import { useRef, useState } from "react";
import { officeImageSrc } from "@/lib/cards";

const MIN_PX = 200;

export default function CardBgUpload({
  currentUrl,
  office,
  firstName,
  lastName,
  title,
}: {
  currentUrl: string | null;
  office: string | null;
  firstName: string;
  lastName: string;
  title: string;
}) {
  const defaultBg = officeImageSrc(office);
  const [saved, setSaved] = useState<string | null>(currentUrl);
  const [pending, setPending] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeBg = saved ?? defaultBg;
  const hasCustom = saved !== null;
  const fullName = `${firstName} ${lastName}`;

  function checkDimensions(file: File): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        if (width < MIN_PX || height < MIN_PX) {
          resolve({ ok: false, message: `Image is too small (${width}×${height}px) — use at least ${MIN_PX}px on each side.` });
        } else if (width < 600 || height < 600) {
          resolve({ ok: true, message: `Small image (${width}×${height}px) — may appear soft. 1000px+ looks best.` });
        } else if (width > height * 1.2) {
          resolve({ ok: true, message: "Landscape images get center-cropped — portrait or square orientation works best." });
        } else {
          resolve({ ok: true, message: "" });
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve({ ok: true, message: "" }); };
      img.src = url;
    });
  }

  async function handleFile(file: File) {
    setError("");
    setWarn("");
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Image must be under 5 MB."); return; }
    const { ok, message } = await checkDimensions(file);
    if (!ok) { setError(message); return; }
    const blob = URL.createObjectURL(file);
    setPending(blob);
    setPendingFile(file);
    setWarn(message);
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const res  = await fetch("/api/upload-card-bg", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      if (pending) URL.revokeObjectURL(pending);
      setSaved(json.url);
      setPending(null);
      setPendingFile(null);
      setWarn("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function cancelPending() {
    if (pending) URL.revokeObjectURL(pending);
    setPending(null);
    setPendingFile(null);
    setError("");
    setWarn("");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  // ── Confirm / preview state ──────────────────────────────────────────────
  if (pending) {
    return (
      <div>
        <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(45,27,78,0.4)" }}>
          Preview — does this look right?
        </p>
        <div className="flex items-start gap-4">
          {/* Card preview at ~68% scale of real 190×253 */}
          <div className="relative shrink-0 rounded-xl overflow-hidden" style={{
            width: 130, height: 173,
            border: "2px solid rgba(45,27,78,0.18)",
          }}>
            <div className="absolute inset-0" style={{
              background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
              backgroundImage: `url(${pending})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" aria-hidden>
              {[28, 52, 76].map(r => (
                <circle key={r} cx="110%" cy="50%" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
              ))}
            </svg>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.22)" }} />
            {/* Photo placeholder */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: "28%" }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg style={{ width: 22, height: 22, color: "rgba(255,255,255,0.4)" }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
            </div>
            {/* Name strip */}
            <div className="absolute bottom-0 left-0 right-0" style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.35) 65%, transparent 100%)",
              padding: "20px 8px 8px",
            }}>
              <p className="text-white font-bold leading-tight truncate" style={{ fontSize: 8.5 }}>
                {fullName}
              </p>
              {title && (
                <p className="leading-tight truncate" style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 1.5 }}>
                  {title}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {warn && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3"
                   style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.35)" }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
                <p className="text-xs leading-snug" style={{ color: "#92400e" }}>{warn}</p>
              </div>
            )}
            <p className="text-xs mb-3 leading-snug" style={{ color: "rgba(45,27,78,0.45)" }}>
              Your photo appears in the circle. The name strip is auto-generated.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#C8102E", color: "#fff" }}
              >
                {uploading ? "Saving…" : "Save background"}
              </button>
              <button
                onClick={() => { cancelPending(); setTimeout(() => inputRef.current?.click(), 50); }}
                disabled={uploading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{ background: "rgba(45,27,78,0.07)", color: "#2D1B4E" }}
              >
                Try another
              </button>
              <button
                onClick={cancelPending}
                disabled={uploading}
                className="text-xs disabled:opacity-50 text-left"
                style={{ color: "rgba(45,27,78,0.38)" }}
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
      </div>
    );
  }

  // ── Default / saved state ────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-5">
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
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2D1B4E] mb-0.5">Card background</p>
        <p className="text-xs mb-1" style={{ color: "rgba(45,27,78,0.45)" }}>
          {hasCustom
            ? "Custom background active — upload a new image to replace it."
            : "Defaults to your office image. Upload to personalize your card."}
        </p>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.30)" }}>
          Best: portrait, 1000px+, under 5 MB
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "#C8102E", color: "#fff" }}
        >
          {hasCustom ? "Change background" : "Upload background"}
        </button>
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
    </div>
  );
}
