// Edge Function: Handle Care Action
// Validates cooldown, updates pet stats, records action
// Route: POST /functions/v1/handle-care-action

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TODO: Configure your production URLs here
const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
  'http://localhost:8081',
  'http://localhost:19006',
  'exp://127.0.0.1:19000',
];

// Rate limiting: max 100 requests per 5 minutes per user
const RATE_LIMIT_MAX = 100;
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { pet_id, action_type } = await req.json();

    // Validate inputs
    if (!pet_id || !action_type) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: pet_id, action_type',
          code: 'MISSING_FIELDS'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action type
    const validActionTypes = ['feed', 'play', 'walk', 'pet', 'groom', 'train', 'sleep', 'bath'];
    if (!validActionTypes.includes(action_type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid action_type. Must be one of: ${validActionTypes.join(', ')}`,
          code: 'INVALID_ACTION_TYPE'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call database function to record care action
    const { data: result, error: functionError } = await supabaseClient.rpc('record_care_action', {
      p_pet_id: pet_id,
      p_user_id: user.id,
      p_action_type: action_type,
    });

    if (functionError) {
      console.error('Function error:', functionError);
      return new Response(
        JSON.stringify({
          error: 'Failed to record care action',
          details: functionError.message,
          code: 'FUNCTION_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if action was successful or on cooldown
    if (!result.success) {
      const statusCode = result.code === 'COOLDOWN_ACTIVE' ? 429 : 400;
      return new Response(
        JSON.stringify(result),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch updated pet data
    const { data: petData } = await supabaseClient
      .from('pets')
      .select('*')
      .eq('id', pet_id)
      .single();

    // Generate pet message based on new state
    if (petData) {
      let messageType = 'status';
      if (result.bonus_points > 0) {
        messageType = 'celebration';
      } else if (petData.hunger < 40 || petData.happiness < 40) {
        messageType = 'reminder';
      }

      await supabaseClient.rpc('generate_pet_message', {
        p_pet_id: pet_id,
        p_message_type: messageType,
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Care action recorded successfully',
        action: {
          type: action_type,
          bonus_points: result.bonus_points,
          is_co_op: result.is_co_op,
        },
        pet: petData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in handle_care_action:', error);
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
