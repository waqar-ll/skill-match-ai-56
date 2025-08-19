-- Enable RLS on the Users table (with capital U)
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;

-- Create policies for Users table
CREATE POLICY "Users can view their own profile" 
ON public."Users" 
FOR SELECT 
USING (auth.uid()::text::bigint = id);

CREATE POLICY "Users can update their own profile" 
ON public."Users" 
FOR UPDATE 
USING (auth.uid()::text::bigint = id);