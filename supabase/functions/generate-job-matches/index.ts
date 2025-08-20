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

    const { jobPostingId } = await req.json();

    console.log('Generating matches for job posting:', jobPostingId);

    // Get the job posting
    const { data: jobPosting, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobPostingId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !jobPosting) {
      throw new Error('Job posting not found');
    }

    // Get all candidates for this user
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('user_id', user.id);

    if (candidatesError) {
      throw new Error('Error fetching candidates');
    }

    if (!candidates?.length) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No candidates found to match',
        matches_created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let matchesCreated = 0;

    // Generate matches for each candidate
    for (const candidate of candidates) {
      try {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('job_matches')
          .select('id')
          .eq('job_posting_id', jobPosting.id)
          .eq('candidate_id', candidate.id)
          .single();

        if (existingMatch) {
          console.log(`Match already exists for candidate ${candidate.id}`);
          continue;
        }

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
  "explanation": "Brief explanation of the match quality and key factors",
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"]
}

Scoring criteria:
- 90-100: Excellent match, candidate exceeds requirements
- 80-89: Very good match, candidate meets most requirements with some strengths
- 70-79: Good match, candidate meets basic requirements
- 60-69: Fair match, candidate partially meets requirements
- 50-59: Weak match, candidate has some relevant experience
- 0-49: Poor match, candidate lacks key requirements`
              },
              {
                role: 'user',
                content: `
Job Posting:
Title: ${jobPosting.title}
Description: ${jobPosting.description || 'Not specified'}
Requirements: ${jobPosting.requirements || 'Not specified'}
Skills Required: ${jobPosting.skills?.join(', ') || 'Not specified'}

Candidate:
Name: ${candidate.name}
Experience: ${candidate.experience_years} years
Skills: ${candidate.skills?.join(', ') || 'Not specified'}
Education: ${candidate.education || 'Not specified'}
Summary: ${candidate.summary || 'Not specified'}

Please analyze the match quality and provide a detailed assessment.`
              }
            ],
            temperature: 0.1,
            max_tokens: 800
          }),
        });

        if (!matchingResponse.ok) {
          console.error(`OpenAI API error for candidate ${candidate.id}:`, matchingResponse.status);
          continue;
        }

        const matchingData = await matchingResponse.json();
        const matchInfo = JSON.parse(matchingData.choices[0].message.content);

        // Create job match record
        const { error: matchError } = await supabase
          .from('job_matches')
          .insert({
            user_id: user.id,
            job_posting_id: jobPosting.id,
            candidate_id: candidate.id,
            match_score: Math.min(100, Math.max(0, matchInfo.match_score)),
            explanation: matchInfo.explanation,
            matching_skills: matchInfo.matching_skills || [],
            missing_skills: matchInfo.missing_skills || []
          });

        if (!matchError) {
          matchesCreated++;
          console.log(`Created match for candidate ${candidate.id} with score ${matchInfo.match_score}`);
        } else {
          console.error(`Error creating match for candidate ${candidate.id}:`, matchError);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing candidate ${candidate.id}:`, error);
      }
    }

    // Update job posting with matched candidates count
    await supabase
      .from('job_postings')
      .update({ matched_candidates: matchesCreated })
      .eq('id', jobPosting.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Generated ${matchesCreated} matches successfully`,
      matches_created: matchesCreated,
      total_candidates: candidates.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-job-matches function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});