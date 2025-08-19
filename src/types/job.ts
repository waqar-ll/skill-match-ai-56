export interface JobPosting {
  id: number;
  user_id: string;
  title: string;
  status: 'Active' | 'Draft' | 'Closed';
  matched_candidates: number;
  description?: string;
  requirements?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface JobMatch {
  id: string;
  candidateName: string;
  score: number;
  explanation: string;
  skills: string[];
  experience: string;
}