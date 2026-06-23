export interface BadgeInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Consultant {
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  office?: string;
}

export interface OfficeRow {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  total_count: number;
  met_count: number;
}

export interface ConsultantRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  office: string;
  bio: string;
  skills: string;
  photo_url: string;
  photo_url_l1: string;
  photo_url_l2: string;
  photo_url_l3: string;
  catch_level: number | null;
  is_own_card: boolean;
  badge_ids: string[];
  consultant_xp: number;
  survey_data?: Record<string, string> | null;
}
