// Client-safe bounty types and utilities — no server imports

export interface BountyRow {
  id: number;
  consultant_id: number;
  month: string;
  completed_at: string | null;
  bonus_xp: number;
  first_name: string;
  last_name: string;
  title: string;
  office: string;
  photo_url: string;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((lastDay.getTime() - now.getTime()) / 86_400_000));
}
