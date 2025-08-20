-- Create candidates table for storing resume data
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  experience_years INTEGER,
  skills TEXT[],
  education TEXT,
  summary TEXT,
  resume_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on candidates
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create policies for candidates
CREATE POLICY "Users can view their own candidates" 
ON public.candidates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" 
ON public.candidates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" 
ON public.candidates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create resume_files table for tracking uploaded files
CREATE TABLE public.resume_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resume_files
ALTER TABLE public.resume_files ENABLE ROW LEVEL SECURITY;

-- Create policies for resume_files
CREATE POLICY "Users can view their own resume files" 
ON public.resume_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume files" 
ON public.resume_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume files" 
ON public.resume_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume files" 
ON public.resume_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create job_matches table for storing AI-generated matches
CREATE TABLE public.job_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_posting_id BIGINT REFERENCES public.job_postings(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  explanation TEXT,
  matching_skills TEXT[],
  missing_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_matches
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for job_matches
CREATE POLICY "Users can view their own job matches" 
ON public.job_matches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job matches" 
ON public.job_matches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job matches" 
ON public.job_matches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job matches" 
ON public.job_matches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates on candidates
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for automatic timestamp updates on job_matches
CREATE TRIGGER update_job_matches_updated_at
BEFORE UPDATE ON public.job_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX idx_candidates_skills ON public.candidates USING GIN(skills);
CREATE INDEX idx_resume_files_user_id ON public.resume_files(user_id);
CREATE INDEX idx_resume_files_candidate_id ON public.resume_files(candidate_id);
CREATE INDEX idx_job_matches_user_id ON public.job_matches(user_id);
CREATE INDEX idx_job_matches_job_posting_id ON public.job_matches(job_posting_id);
CREATE INDEX idx_job_matches_candidate_id ON public.job_matches(candidate_id);
CREATE INDEX idx_job_matches_score ON public.job_matches(match_score DESC);