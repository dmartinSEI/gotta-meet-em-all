export interface Consultant {
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  office?: string;
}

export interface ConsultantRow {
  id: number;
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
}
