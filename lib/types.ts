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
  is_caught: boolean;
  is_own_card: boolean;
}
