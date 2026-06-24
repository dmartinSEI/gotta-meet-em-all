"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addConsultant, updateConsultant, deleteConsultant, setNewHire } from "./actions";

export interface ConsultantRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  office: string;
  is_new_hire: boolean;
}

function Field({
  name,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      className="w-full text-sm border rounded px-2 py-1.5 text-[#2D1B4E] bg-white focus:outline-none focus:border-[#C8102E]"
      style={{ borderColor: "rgba(45,27,78,0.25)" }}
    />
  );
}

export default function ConsultantManager({
  consultants,
}: {
  consultants: ConsultantRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = consultants.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.office ?? "").toLowerCase().includes(q)
    );
  });

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAdd(formData: FormData) {
    setError(null);
    const result = await addConsultant(formData);
    if (!result.success) { setError(result.error ?? "Failed"); return; }
    setAddingNew(false);
    refresh();
  }

  async function handleEdit(id: number, formData: FormData) {
    setError(null);
    const result = await updateConsultant.bind(null, id)(formData);
    if (!result.success) { setError(result.error ?? "Failed"); return; }
    setEditingId(null);
    refresh();
  }

  async function handleDelete(id: number) {
    setError(null);
    const result = await deleteConsultant(id);
    if (!result.success) { setError(result.error ?? "Failed"); return; }
    setConfirmDeleteId(null);
    refresh();
  }

  const inputCls =
    "flex-1 text-sm border rounded-lg px-3 py-2 text-[#2D1B4E] bg-white focus:outline-none focus:border-[#C8102E]";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Search name, email, or office…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls}
          style={{ borderColor: "rgba(45,27,78,0.2)" }}
        />
        <button
          onClick={() => { setAddingNew(true); setEditingId(null); setError(null); }}
          className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg bg-[#C8102E] text-white hover:bg-[#a00d25] transition-colors"
        >
          + Add
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-3 font-medium">{error}</p>}

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(45,27,78,0.12)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(45,27,78,0.04)", borderBottom: "1px solid rgba(45,27,78,0.1)" }}>
              {["Name", "Email", "Office", "Title", "New Hire", ""].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-xs font-semibold ${h ? "text-left" : ""}`}
                  style={{ color: "rgba(45,27,78,0.45)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ── Add row ── */}
            {addingNew && (
              <tr style={{ borderBottom: "1px solid rgba(45,27,78,0.07)", background: "rgba(200,16,46,0.03)" }}>
                <td colSpan={6} className="px-4 py-3">
                  <form action={handleAdd}>
                    <div className="flex flex-wrap gap-2 items-end">
                      <LabeledField label="First name *" name="first_name" placeholder="Jane" required />
                      <LabeledField label="Last name *"  name="last_name"  placeholder="Smith" required />
                      <LabeledField label="Email *"      name="email"      placeholder="jsmith@sei.com" required />
                      <LabeledField label="Office"       name="office"     placeholder="Cincinnati" />
                      <LabeledField label="Title"        name="title"      placeholder="Sr. Consultant" />
                      <div className="flex gap-2 pb-0.5">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="text-xs font-semibold px-3 py-1.5 rounded bg-[#C8102E] text-white hover:bg-[#a00d25] transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingNew(false); setError(null); }}
                          className="text-xs px-2 py-1.5 transition-colors hover:text-[#2D1B4E]"
                          style={{ color: "rgba(45,27,78,0.45)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </td>
              </tr>
            )}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "rgba(45,27,78,0.3)" }}>
                  {search ? "No matches" : "No consultants yet"}
                </td>
              </tr>
            )}

            {filtered.map((c) =>
              editingId === c.id ? (
                /* ── Edit row ── */
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(45,27,78,0.07)", background: "rgba(251,191,36,0.06)" }}>
                  <td colSpan={6} className="px-4 py-3">
                    <form action={(fd) => handleEdit(c.id, fd)}>
                      <div className="flex flex-wrap gap-2 items-end">
                        <LabeledField label="First name *" name="first_name" defaultValue={c.first_name} required />
                        <LabeledField label="Last name *"  name="last_name"  defaultValue={c.last_name}  required />
                        <LabeledField label="Office"       name="office"     defaultValue={c.office} />
                        <LabeledField label="Title"        name="title"      defaultValue={c.title} />
                        <div className="flex gap-2 pb-0.5">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="text-xs font-semibold px-3 py-1.5 rounded bg-[#2D1B4E] text-white hover:bg-[#1a0f2e] transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); setError(null); }}
                            className="text-xs px-2 py-1.5 transition-colors hover:text-[#2D1B4E]"
                            style={{ color: "rgba(45,27,78,0.45)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                /* ── Normal row ── */
                <tr
                  key={c.id}
                  style={{ borderBottom: "1px solid rgba(45,27,78,0.07)" }}
                  className="transition-colors hover:bg-[rgba(45,27,78,0.015)]"
                >
                  <td className="px-4 py-3 font-medium text-[#2D1B4E]">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(45,27,78,0.55)" }}>
                    {c.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: "rgba(45,27,78,0.55)" }}>
                    {c.office || "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "rgba(45,27,78,0.55)" }}>
                    {c.title || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={async () => { await setNewHire(c.id, !c.is_new_hire); refresh(); }}
                      disabled={isPending}
                      title={c.is_new_hire ? "Remove new hire status" : "Mark as new hire"}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50"
                      style={c.is_new_hire
                        ? { background: "rgba(34,197,94,0.12)", color: "#15803d", borderColor: "rgba(34,197,94,0.4)" }
                        : { background: "transparent", color: "rgba(45,27,78,0.30)", borderColor: "rgba(45,27,78,0.15)" }}
                    >
                      {c.is_new_hire ? "✓ New Hire" : "+ New Hire"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {confirmDeleteId === c.id ? (
                      <span className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-medium text-red-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={isPending}
                          className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs transition-colors hover:text-[#2D1B4E]"
                          style={{ color: "rgba(45,27,78,0.45)" }}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => { setEditingId(c.id); setConfirmDeleteId(null); setError(null); }}
                          className="text-xs font-medium transition-colors hover:text-[#2D1B4E]"
                          style={{ color: "rgba(45,27,78,0.45)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(c.id); setEditingId(null); }}
                          className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-2" style={{ color: "rgba(45,27,78,0.3)" }}>
        {filtered.length} of {consultants.length} consultants
      </p>
    </div>
  );
}

function LabeledField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex-1 min-w-[130px]">
      <label className="block text-xs mb-1" style={{ color: "rgba(45,27,78,0.45)" }}>
        {label}
      </label>
      <Field name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} />
    </div>
  );
}
