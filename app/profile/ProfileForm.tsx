"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

export default function ProfileForm({
  initialBio,
  initialSkills,
}: {
  initialBio: string;
  initialSkills: string;
}) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [skills, setSkills] = useState(initialSkills ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateProfile({ bio, skills });
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">About me</label>
        <textarea
          value={bio}
          onChange={(e) => { setBio(e.target.value); setSaved(false); }}
          rows={4}
          maxLength={500}
          placeholder="A short bio about yourself…"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/500</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
        <p className="text-xs text-gray-400 mb-2">
          Separate with commas — e.g. Data Analysis, Python, Project Management
        </p>
        <input
          type="text"
          value={skills}
          onChange={(e) => { setSkills(e.target.value); setSaved(false); }}
          maxLength={300}
          placeholder="Data Analysis, Python, Project Management…"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{skills.length}/300</p>
        {skills && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
