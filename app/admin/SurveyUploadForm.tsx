"use client";

import { useRef, useState } from "react";
import { importSurveyData } from "./actions";

type Result =
  | { ok: true; matched: number; unmatched: number; unrecognizedColumns: string[] }
  | { ok: false; message: string };

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function SurveyUploadForm() {
  const formRef  = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    if (file && file.size > MAX_FILE_BYTES) {
      setResult({ ok: false, message: "File is too large. Max size is 5MB." });
      return;
    }

    setLoading(true);
    const res = await importSurveyData(formData);

    if (res.success) {
      setResult({
        ok: true,
        matched: res.matched,
        unmatched: res.unmatched,
        unrecognizedColumns: res.unrecognizedColumns,
      });
      formRef.current?.reset();
    } else {
      setResult({ ok: false, message: res.error ?? "Something went wrong." });
    }

    setLoading(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="survey-file" className="block text-sm font-medium text-gray-700 mb-1">
          Survey responses (.xlsx exported from Microsoft Forms)
        </label>
        <input
          id="survey-file"
          name="file"
          type="file"
          accept=".xlsx,.xls"
          required
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Importing…" : "Import Survey Data"}
      </button>

      {result && (
        <div className={`text-sm rounded p-3 ${result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {result.ok ? (
            <>
              <p className="font-semibold">
                ✓ {result.matched} consultant{result.matched === 1 ? "" : "s"} updated
                {result.unmatched > 0 && `, ${result.unmatched} email${result.unmatched === 1 ? "" : "s"} not matched`}.
              </p>
              {result.unrecognizedColumns.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-amber-700 font-medium">
                    ⚠ {result.unrecognizedColumns.length} unrecognized column{result.unrecognizedColumns.length === 1 ? "" : "s"} (data skipped)
                  </summary>
                  <ul className="mt-1 ml-4 list-disc text-xs text-amber-700 space-y-0.5">
                    {result.unrecognizedColumns.map(col => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-amber-600">
                    Add these to <code>lib/survey-fields.ts</code> to capture them next import.
                  </p>
                </details>
              )}
            </>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      )}
    </form>
  );
}
