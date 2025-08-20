import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openAIApiKey = Deno.env.get('OPEN_AI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { resumeText, filename, fileSize, fileType } = await req.json();

    console.log('Processing resume:', filename);

    // Extract candidate information using OpenAI
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured information from the resume text and return it as JSON with the following format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "experience_years": number,
  "skills": ["skill1", "skill2", "skill3"],
  "education": "Highest education degree and institution",
  "summary": "Brief professional summary"
}

Rules:
- Extract only information that is explicitly mentioned in the resume
- For experience_years, calculate total years of professional experience
- Include only technical and professional skills in the skills array
- Keep the summary under 200 characters
- If information is not available, use null for strings and 0 for numbers`
          },
          {
            role: 'user',
            content: `Please extract information from this resume:\n\n${resumeText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${extractionResponse.status}`);
    }

    const extractionData = await extractionResponse.json();
    const candidateInfo = JSON.parse(extractionData.choices[0].message.content);

    console.log('Extracted candidate info:', candidateInfo);

    // Create candidate record
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        user_id: user.id,
        name: candidateInfo.name || 'Unknown',
        email: candidateInfo.email,
        phone: candidateInfo.phone,
        experience_years: candidateInfo.experience_years || 0,
        skills: candidateInfo.skills || [],
        education: candidateInfo.education,
        summary: candidateInfo.summary,
        resume_text: resumeText
      })
      .select()
      .single();

    if (candidateError) {
      console.error('Error creating candidate:', candidateError);
      throw candidateError;
    }

    // Create resume file record
    const { error: fileError } = await supabase
      .from('resume_files')
      .insert({
        user_id: user.id,
        candidate_id: candidate.id,
        filename: filename,
        file_size: fileSize,
        file_type: fileType,
        status: 'completed'
      });

    if (fileError) {
      console.error('Error creating resume file record:', fileError);
    }

    // Background task: Generate job matches
    const backgroundTask = async () => {
      try {
        // Get user's job postings
        const { data: jobPostings, error: jobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'Active');

        if (jobsError || !jobPostings?.length) {
          console.log('No active job postings found for matching');
          return;
        }

        // Generate matches for each job posting
        for (const job of jobPostings) {
          try {
            const matchingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: `You are an expert recruiter. Analyze the match between a candidate and a job posting. Return JSON with this format:
{
  "match_score": number (0-100),
  "explanation": "Brief explanation of the match quality",
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"]
}

Consider:
- Skills alignment
- Experience level
- Education requirements
- Overall fit for the role`
                  },
                  {
                    role: 'user',
                    content: `
Job Posting:
Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements}
Skills: ${job.skills?.join(', ') || 'Not specified'}

Candidate:
Name: ${candidateInfo.name}
Experience: ${candidateInfo.experience_years} years
Skills: ${candidateInfo.skills?.join(', ') || 'Not specified'}
Education: ${candidateInfo.education || 'Not specified'}
Summary: ${candidateInfo.summary || 'Not specified'}
`
                  }
                ],
                temperature: 0.1,
                max_tokens: 500
              }),
            });

            if (matchingResponse.ok) {
              const matchingData = await matchingResponse.json();
              const matchInfo = JSON.parse(matchingData.choices[0].message.content);

              // Create job match record
              await supabase
                .from('job_matches')
                .insert({
                  user_id: user.id,
                  job_posting_id: job.id,
                  candidate_id: candidate.id,
                  match_score: Math.min(100, Math.max(0, matchInfo.match_score)),
                  explanation: matchInfo.explanation,
                  matching_skills: matchInfo.matching_skills || [],
                  missing_skills: matchInfo.missing_skills || []
                });

              console.log(`Created match for job ${job.id} with score ${matchInfo.match_score}`);
            }
          } catch (error) {
            console.error(`Error creating match for job ${job.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in background matching task:', error);
      }
    };

    // Start background task without waiting
    EdgeRuntime.waitUntil(backgroundTask());

    return new Response(JSON.stringify({ 
      success: true, 
      candidate: candidate,
      message: 'Resume processed successfully. Job matching in progress.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});