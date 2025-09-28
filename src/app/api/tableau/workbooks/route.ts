import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // First authenticate
    const authResponse = await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials: {
          name: process.env.TABLEAU_USERNAME,
          password: process.env.TABLEAU_PASSWORD,
          ...(process.env.TABLEAU_SITE_ID && process.env.TABLEAU_SITE_ID !== '' && {
            site: {
              contentUrl: process.env.TABLEAU_SITE_ID
            }
          })
        }
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      return NextResponse.json({
        error: `Authentication failed: ${authResponse.status} ${errorText}`
      }, { status: 401 });
    }

    const authData = await authResponse.json();
    const token = authData.credentials.token;
    const siteId = authData.credentials.site.id;

    // Get workbooks
    const workbooksResponse = await fetch(
      `${process.env.TABLEAU_SERVER_URL}/api/3.19/sites/${siteId}/workbooks`,
      {
        headers: {
          'X-Tableau-Auth': token
        }
      }
    );

    if (!workbooksResponse.ok) {
      const errorText = await workbooksResponse.text();
      return NextResponse.json({
        error: `Failed to fetch workbooks: ${workbooksResponse.status} ${errorText}`
      }, { status: 500 });
    }

    const workbooksData = await workbooksResponse.json();
    const workbooks = workbooksData.workbooks?.workbook || [];

    // Sign out
    await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signout`, {
      method: 'POST',
      headers: {
        'X-Tableau-Auth': token
      }
    });

    return NextResponse.json(workbooks.map((wb: any) => ({
      id: wb.id,
      name: wb.name,
      contentUrl: wb.contentUrl,
      createdAt: wb.createdAt,
      updatedAt: wb.updatedAt,
      size: wb.size,
      showTabs: wb.showTabs
    })));

  } catch (error) {
    console.error('Workbooks API error:', error);
    return NextResponse.json({
      error: `Failed to fetch workbooks: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}