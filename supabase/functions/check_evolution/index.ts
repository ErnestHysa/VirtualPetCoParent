// Edge Function: Check Evolution
// Evaluates if pet should evolve based on streak and XP
// Route: POST /functions/v1/check-evolution

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TODO: Configure your production URLs here
const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
  'http://localhost:8081',
  'http://localhost:19006',
  'exp://127.0.0.1:19000',
];

// Rate limiting: max 50 requests per 5 minutes per user
const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

// In-memory rate limit store (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getCorsHeaders(requestOrigin: string | null) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin || '') ? requestOrigin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
    };
  }

  userLimit.count++;
  return { allowed: true };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retry_after: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter),
          },
        }
      );
    }

    // Parse request body
    const { pet_id } = await req.json();

    // Validate inputs
    if (!pet_id) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: pet_id',
          code: 'MISSING_PET_ID'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this pet
    const { data: pet, error: petError } = await supabaseClient
      .from('pets')
      .select(`
        *,
        couples (
          user1_id,
          user2_id
        )
      `)
      .eq('id', pet_id)
      .single();

    if (petError || !pet) {
      return new Response(
        JSON.stringify({
          error: 'Pet not found',
          code: 'PET_NOT_FOUND'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is authorized (is in the couple)
    const isAuthorized = pet.couples?.user1_id === user.id || pet.couples?.user2_id === user.id;

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized to access this pet',
          code: 'UNAUTHORIZED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store current stage before checking evolution
    const previousStage = pet.current_stage;

    // Call database function to check evolution
    const { data: newStage, error: functionError } = await supabaseClient.rpc('check_pet_evolution', {
      pet_id: pet_id,
    });

    if (functionError) {
      console.error('Function error:', functionError);
      return new Response(
        JSON.stringify({
          error: 'Failed to check evolution',
          details: functionError.message,
          code: 'FUNCTION_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch updated pet data
    const { data: updatedPet } = await supabaseClient
      .from('pets')
      .select('*')
      .eq('id', pet_id)
      .single();

    // Check if evolution occurred
    const hasEvolved = previousStage !== newStage;

    // Build response
    const response = {
      success: true,
      has_evolved: hasEvolved,
      previous_stage: previousStage,
      current_stage: newStage,
      pet: updatedPet,
      message: hasEvolved
        ? `Congratulations! Your pet evolved from ${previousStage} to ${newStage}!`
        : 'Your pet is not ready to evolve yet. Keep caring for it!',
    };

    // If evolution occurred, generate celebration message
    if (hasEvolved) {
      await supabaseClient.rpc('generate_pet_message', {
        p_pet_id: pet_id,
        p_message_type: 'celebration',
      });

      // Check for evolution milestones
      const milestoneTypes: Record<string, string> = {
        'baby': 'three_day_streak',
        'child': 'fourteen_day_streak',
        'teen': 'thirty_day_streak',
        'adult': 'sixty_day_streak',
        'elder': 'hundred_day_streak',
      };

      const milestoneType = milestoneTypes[newStage];
      if (milestoneType) {
        const { data: existingMilestone } = await supabaseClient
          .from('milestones')
          .select('id')
          .eq('couple_id', pet.couple_id)
          .eq('milestone_type', milestoneType)
          .single();

        if (!existingMilestone) {
          await supabaseClient.from('milestones').insert({
            couple_id: pet.couple_id,
            milestone_type: milestoneType,
            evolution_unlocked: newStage,
            celebrated_by: user.id,
          });
        }
      }
    }

    // Return evolution status
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check_evolution:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
