import { NextRequest, NextResponse } from 'next/server';

// Tableau authentication endpoint
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    console.log('Tableau auth request received');
    console.log('Environment check:');
    console.log('- TABLEAU_SERVER_URL:', process.env.TABLEAU_SERVER_URL);
    console.log('- TABLEAU_USERNAME:', process.env.TABLEAU_USERNAME ? 'Set' : 'Not set');
    console.log('- TABLEAU_PASSWORD:', process.env.TABLEAU_PASSWORD ? 'Set' : 'Not set');
    console.log('- TABLEAU_SITE_ID:', process.env.TABLEAU_SITE_ID || 'Empty (default site)');

    // Check if we have Personal Access Token (recommended for Tableau Online)
    if (process.env.TABLEAU_PERSONAL_ACCESS_TOKEN) {
      console.log('Using Personal Access Token authentication');
      const authToken = await authenticateWithPAT();
      return NextResponse.json({
        token: authToken,
        serverUrl: process.env.TABLEAU_SERVER_URL,
        authType: 'pat'
      });
    }

    // Use username/password authentication for Tableau Online
    if (process.env.TABLEAU_USERNAME && process.env.TABLEAU_PASSWORD) {
      console.log('Using username/password authentication');
      const authToken = await authenticateWithCredentials();
      return NextResponse.json({
        token: authToken,
        serverUrl: process.env.TABLEAU_SERVER_URL,
        authType: 'credentials'
      });
    }

    // Fallback to trusted ticket for Tableau Server
    console.log('Falling back to trusted ticket authentication');
    const trustedTicket = await generateTableauTrustedTicket(username);

    return NextResponse.json({
      ticket: trustedTicket,
      serverUrl: process.env.TABLEAU_SERVER_URL,
      authType: 'trusted'
    });
  } catch (error) {
    console.error('Tableau auth error:', error);
    return NextResponse.json(
      { error: `Authentication failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

async function authenticateWithCredentials() {
  // Build the credentials object properly
  const credentials: any = {
    name: process.env.TABLEAU_USERNAME,
    password: process.env.TABLEAU_PASSWORD,
    site: {
      contentUrl: process.env.TABLEAU_SITE_ID || ""
    }
  };

  const authPayload = {
    credentials: credentials
  };

  console.log('Attempting authentication with payload:', JSON.stringify(authPayload, null, 2));

  const response = await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Authentication failed:', response.status, errorText);
    throw new Error(`Authentication failed: ${response.status} ${errorText}`);
  }

  // Check if response is JSON or XML
  const contentType = response.headers.get('content-type');
  const responseText = await response.text();

  if (contentType && contentType.includes('application/json')) {
    const data = JSON.parse(responseText);
    return data.credentials.token;
  } else if (contentType && contentType.includes('application/xml')) {
    // Parse XML response for successful authentication
    const tokenMatch = responseText.match(/token="([^"]+)"/);
    if (tokenMatch) {
      console.log('Successfully authenticated with XML response');
      return tokenMatch[1];
    } else {
      throw new Error(`XML response but no token found: ${responseText}`);
    }
  } else {
    throw new Error(`Unexpected response format: ${responseText}`);
  }
}

async function authenticateWithPAT() {
  const response = await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      credentials: {
        personalAccessTokenName: process.env.TABLEAU_TOKEN_NAME,
        personalAccessTokenSecret: process.env.TABLEAU_PERSONAL_ACCESS_TOKEN,
        site: {
          contentUrl: process.env.TABLEAU_SITE_ID || ''
        }
      }
    }),
  });

  const data = await response.json();
  return data.credentials.token;
}

async function generateTableauTrustedTicket(username: string) {
  const response = await fetch(`${process.env.TABLEAU_SERVER_URL}/trusted`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: username || process.env.TABLEAU_TRUSTED_USER || 'guest',
      target_site: process.env.TABLEAU_SITE_ID || '',
    }),
  });

  const ticket = await response.text();

  // Check if ticket generation failed
  if (ticket === '-1') {
    throw new Error('Trusted ticket generation failed');
  }

  return ticket;
}