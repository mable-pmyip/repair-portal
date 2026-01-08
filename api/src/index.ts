interface Env {
  FIREBASE_WEB_API_KEY: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Health check endpoint
function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Repair Portal API Worker is running',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Create user using Firebase REST API
async function handleCreateUser(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { username, department, password, createdBy } = body as {
      username?: string;
      department?: string;
      password?: string;
      createdBy?: string;
    };

    // Validate input
    if (!username || !department || !password) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: username, department, or password',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize username for email
    const sanitizedUsername = username
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]/g, '')
      .replace(/^[.-]+|[.-]+$/g, '')
      .replace(/\.{2,}/g, '.')
      .slice(0, 64);

    const email = `${sanitizedUsername}@repairportal.com`;

    // Create user via Firebase Auth REST API
    const createUserResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${env.FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          displayName: username,
          returnSecureToken: true,
        }),
      }
    );

    const createUserData: any = await createUserResponse.json();

    if (!createUserResponse.ok) {
      if (createUserData.error?.message?.includes('EMAIL_EXISTS')) {
        return new Response(
          JSON.stringify({
            error: 'A user with this username already exists',
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(createUserData.error?.message || 'Failed to create user');
    }

    // Return success - frontend will handle Firestore write
    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        uid: createUserData.localId,
        email: email,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to create user',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Delete user using Firebase REST API
async function handleDeleteUser(uid: string, env: Env): Promise<Response> {
  try {
    // Delete from Firebase Auth
    const deleteResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${env.FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localId: uid,
        }),
      }
    );

    if (!deleteResponse.ok) {
      const errorData: any = await deleteResponse.json();
      throw new Error(errorData.error?.message || 'Failed to delete user');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted from Authentication',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to delete user',
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions();
    }

    // Route handling
    if (pathname === '/api/health' && method === 'GET') {
      return handleHealth();
    }

    if (pathname === '/api/create-user' && method === 'POST') {
      return handleCreateUser(request, env);
    }

    if (pathname.startsWith('/api/delete-user/') && method === 'DELETE') {
      const uid = pathname.split('/api/delete-user/')[1];
      return handleDeleteUser(uid, env);
    }

    // 404 for unknown routes:::::
    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};
