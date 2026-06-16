"use client";

import { useRef, useState } from "react";
import { importConsultants } from "./actions";

type Status = { ok: boolean; message: string };

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    if (file && file.size > MAX_FILE_BYTES) {
      setStatus({ ok: false, message: "File is too large. Max size is 5MB." });
      return;
    }

    setLoading(true);
    const result = await importConsultants(formData);

    if (result.success) {
      const n = result.count;
      setStatus({ ok: true, message: `Imported ${n} consultant${n === 1 ? "" : "s"}.` });
      formRef.current?.reset();
    } else {
      setStatus({ ok: false, message: result.error ?? "Something went wrong." });
    }

    setLoading(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
          Consultant roster (.xlsx)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,.xls"
          required
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Importing…" : "Import Consultants"}
      </button>

      {status && (
        <p className={`text-sm font-medium ${status.ok ? "text-green-700" : "text-red-600"}`}>
          {status.message}
        </p>
      )}
    </form>
  );
}
