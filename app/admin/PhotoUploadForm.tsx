"use client";

import { useRef, useState } from "react";
import { importPhotos } from "./actions";

type Result =
  | { success: true; matched: number; unmatched: string[]; errors: string[] }
  | { success: false; error: string };

export default function PhotoUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await importPhotos(new FormData(e.currentTarget));
    setResult(res);
    if (res.success) formRef.current?.reset();
    setLoading(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="photos" className="block text-sm font-medium text-gray-700 mb-1">
          Consultant photos
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Name each file after the consultant&apos;s email address:{" "}
          <span className="font-mono">dmartin@sei.com.jpg</span>. Accepts jpg, png, webp — max 5MB
          per file.
        </p>
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          required
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Uploading…" : "Upload Photos"}
      </button>

      {result && (
        <div className="flex flex-col gap-2 text-sm">
          {result.success ? (
            <>
              <p className="font-medium text-green-700">
                {result.matched} photo{result.matched !== 1 ? "s" : ""} uploaded successfully.
              </p>
              {result.unmatched.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="font-medium text-yellow-800 mb-1">
                    {result.unmatched.length} file{result.unmatched.length !== 1 ? "s" : ""} didn&apos;t
                    match any consultant email:
                  </p>
                  <ul className="text-yellow-700 font-mono text-xs space-y-0.5">
                    {result.unmatched.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-medium text-red-800 mb-1">Skipped:</p>
                  <ul className="text-red-700 text-xs space-y-0.5">
                    {result.errors.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-red-600 font-medium">{result.error}</p>
          )}
        </div>
      )}
    </form>
  );
}
