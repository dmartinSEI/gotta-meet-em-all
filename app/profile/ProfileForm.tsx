"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import type { PreferredComm } from "@/lib/types";

const COMM_OPTIONS: PreferredComm[] = ["Email", "Teams", "Calendar Invite"];

const COMM_ICONS: Record<PreferredComm, string> = {
  "Email":           "✉️",
  "Teams":           "💬",
  "Calendar Invite": "📅",
};

export default function ProfileForm({
  initialBio,
  initialSkills,
  initialCurrentClient,
  initialPastClients,
  initialPreferredComm,
}: {
  initialBio: string;
  initialSkills: string;
  initialCurrentClient: string;
  initialPastClients: string;
  initialPreferredComm: PreferredComm | "";
}) {
  const [bio,           setBio]           = useState(initialBio);
  const [skills,        setSkills]        = useState(initialSkills);
  const [currentClient, setCurrentClient] = useState(initialCurrentClient);
  const [pastClients,   setPastClients]   = useState(initialPastClients);
  const [preferredComm, setPreferredComm] = useState<PreferredComm | "">(initialPreferredComm);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  function markDirty() { setSaved(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateProfile({ bio, skills, current_client: currentClient, past_clients: pastClients, preferred_comm: preferredComm });
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const pastClientList = pastClients.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-[#2D1B4E] mb-1">About me</label>
        <textarea
          value={bio}
          onChange={(e) => { setBio(e.target.value); markDirty(); }}
          rows={4}
          maxLength={500}
          placeholder="A short bio about yourself…"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D1B4E]/30 resize-none"
          style={{ borderColor: "rgba(45,27,78,0.18)" }}
        />
        <p className="text-xs text-right mt-1" style={{ color: "rgba(45,27,78,0.35)" }}>{bio.length}/500</p>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-[#2D1B4E] mb-1">Skills</label>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.45)" }}>
          Separate with commas — up to 5 skills
        </p>
        <input
          type="text"
          value={skills}
          onChange={(e) => { setSkills(e.target.value); markDirty(); }}
          maxLength={300}
          placeholder="Data Analysis, Python, Project Management…"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D1B4E]/30"
          style={{ borderColor: "rgba(45,27,78,0.18)" }}
        />
        {(() => {
          const parsed = skills.split(",").map((s) => s.trim()).filter(Boolean);
          const over = parsed.length > 5;
          return (
            <>
              <p className="text-xs text-right mt-1" style={{ color: over ? "#C8102E" : "rgba(45,27,78,0.35)" }}>
                {parsed.length}/5 skills{over ? " — only the first 5 will be saved" : ""}
              </p>
              {parsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsed.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full border"
                          style={i < 5
                            ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }
                            : { background: "rgba(200,16,46,0.07)", color: "#C8102E", borderColor: "rgba(200,16,46,0.25)" }
                          }>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Current client */}
      <div>
        <label className="block text-sm font-medium text-[#2D1B4E] mb-1">Current client</label>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.45)" }}>
          The engagement or client you are actively working on right now.
        </p>
        <input
          type="text"
          value={currentClient}
          onChange={(e) => { setCurrentClient(e.target.value); markDirty(); }}
          maxLength={100}
          placeholder="e.g. Dunder Mifflin, Vandelay Industries…"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D1B4E]/30"
          style={{ borderColor: "rgba(45,27,78,0.18)" }}
        />
      </div>

      {/* Past clients */}
      <div>
        <label className="block text-sm font-medium text-[#2D1B4E] mb-1">Past clients</label>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.45)" }}>
          Separate with commas — clients or engagements from previous work.
        </p>
        <input
          type="text"
          value={pastClients}
          onChange={(e) => { setPastClients(e.target.value); markDirty(); }}
          maxLength={500}
          placeholder="e.g. Initech, Los Pollos Hermanos, Umbrella Corp…"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D1B4E]/30"
          style={{ borderColor: "rgba(45,27,78,0.18)" }}
        />
        {pastClients && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pastClientList.map((client, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-full border"
                    style={{ background: "rgba(45,27,78,0.05)", color: "#2D1B4E", borderColor: "rgba(45,27,78,0.15)" }}>
                {client}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preferred communication */}
      <div>
        <label className="block text-sm font-medium text-[#2D1B4E] mb-1">Preferred communication</label>
        <p className="text-xs mb-2" style={{ color: "rgba(45,27,78,0.45)" }}>
          How colleagues should reach out to you.
        </p>
        <select
          value={preferredComm}
          onChange={(e) => { setPreferredComm(e.target.value as PreferredComm | ""); markDirty(); }}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2D1B4E]/30 bg-white"
          style={{ borderColor: "rgba(45,27,78,0.18)", color: preferredComm ? "#2D1B4E" : "rgba(45,27,78,0.40)" }}
        >
          <option value="">Select a preference…</option>
          {COMM_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{COMM_ICONS[opt]} {opt}</option>
          ))}
        </select>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          style={{ background: "#2D1B4E" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <p className="text-sm" style={{ color: "#16a34a" }}>Saved!</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
