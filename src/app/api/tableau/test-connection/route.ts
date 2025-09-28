import { NextResponse } from 'next/server';
import { TableauConnection, validateTableauConfig } from '@/lib/tableau-connection';

export async function GET() {
  try {
    // Validate configuration first
    const configValidation = validateTableauConfig();
    if (!configValidation.valid) {
      return NextResponse.json({
        success: false,
        message: 'Tableau configuration incomplete',
        missing: configValidation.missing
      }, { status: 400 });
    }

    // Test connection
    const connection = new TableauConnection({
      serverUrl: process.env.TABLEAU_SERVER_URL!,
      siteId: process.env.TABLEAU_SITE_ID,
      personalAccessToken: process.env.TABLEAU_PERSONAL_ACCESS_TOKEN,
      tokenName: process.env.TABLEAU_TOKEN_NAME
    });

    const result = await connection.testConnection();
    
    if (result.success) {
      // Also try to get workbooks list
      const workbooks = await connection.getWorkbooks();
      
      return NextResponse.json({
        ...result,
        workbooksCount: workbooks.length,
        workbooks: workbooks.slice(0, 5).map(wb => ({
          id: wb.id,
          name: wb.name,
          contentUrl: wb.contentUrl
        }))
      });
    }

    return NextResponse.json(result, { status: 500 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}