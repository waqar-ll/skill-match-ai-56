-- Create job_postings table
CREATE TABLE public.job_postings (
  id BIGINT NOT NULL DEFAULT nextval('job_postings_id_seq'::regclass) PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Active', 'Draft', 'Closed')),
  matched_candidates INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  requirements TEXT,
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for job_postings
CREATE SEQUENCE IF NOT EXISTS job_postings_id_seq;

-- Enable Row Level Security
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Create policies for job_postings
CREATE POLICY "Users can view their own job postings" 
ON public.job_postings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job postings" 
ON public.job_postings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job postings" 
ON public.job_postings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job postings" 
ON public.job_postings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert dummy data
INSERT INTO public.job_postings (user_id, title, status, matched_candidates, description, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Software Engineer', 'Active', 12, 'Full-stack software engineer position', '2025-08-15 00:00:00+00'),
('00000000-0000-0000-0000-000000000000', 'Product Manager', 'Draft', 5, 'Product manager role for startup', '2025-08-10 00:00:00+00'),
('00000000-0000-0000-0000-000000000000', 'Data Analyst', 'Closed', 8, 'Data analyst position', '2025-07-20 00:00:00+00');