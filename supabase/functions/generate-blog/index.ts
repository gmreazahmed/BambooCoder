import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateBlogRequest {
  topic: string;
  tone?: string;
}

// Input validation to prevent injection attacks
const validateInput = (topic: string, tone?: string): { valid: boolean; error?: string } => {
  // Validate topic
  if (!topic || typeof topic !== 'string') {
    return { valid: false, error: "Topic must be a non-empty string" };
  }
  
  const trimmedTopic = topic.trim();
  if (trimmedTopic.length === 0) {
    return { valid: false, error: "Topic cannot be empty" };
  }
  
  if (trimmedTopic.length > 200) {
    return { valid: false, error: "Topic must be less than 200 characters" };
  }
  
  // Validate tone if provided
  if (tone !== undefined && typeof tone !== 'string') {
    return { valid: false, error: "Tone must be a string" };
  }
  
  if (tone && tone.trim().length > 50) {
    return { valid: false, error: "Tone must be less than 50 characters" };
  }
  
  return { valid: true };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated and has admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${user.id} authorized for blog generation`);

    const { topic, tone = "professional" }: GenerateBlogRequest = await req.json();

    // Validate and sanitize input
    const validation = validateInput(topic, tone);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedTopic = topic.trim();
    const sanitizedTone = tone ? tone.trim() : "professional";

    console.log(`Generating blog for topic: ${sanitizedTopic}, tone: ${sanitizedTone}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Generate blog content using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert technical blog writer for Bamboo Coders, a modern web development agency specializing in React and Next.js. Write engaging, informative blog posts with a ${sanitizedTone} tone. Include practical examples and insights.`
          },
          {
            role: 'user',
            content: `Write a comprehensive blog post about: ${sanitizedTopic}

The blog should include:
1. A catchy, SEO-friendly title (max 60 characters)
2. A brief excerpt (max 160 characters) 
3. Full article content in Markdown format with proper headings, code examples if relevant, and practical insights

Format your response as JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "... markdown content ..."
}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Raw AI response:', generatedText);

    // Parse the JSON response
    let blogData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                       generatedText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, generatedText];
      const jsonString = jsonMatch[1] || generatedText;
      blogData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create structured data from the text
      blogData = {
        title: topic,
        excerpt: `Learn about ${topic} in web development`,
        content: generatedText
      };
    }

    console.log('Successfully generated blog:', blogData.title);

    return new Response(
      JSON.stringify(blogData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-blog function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});