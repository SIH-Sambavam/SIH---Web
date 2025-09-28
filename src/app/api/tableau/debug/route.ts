import { NextResponse } from 'next/server';

export async function GET() {
  const results: string[] = [];
  
  try {
    results.push('=== Tableau Configuration Debug ===');
    results.push(`Server URL: ${process.env.TABLEAU_SERVER_URL}`);
    results.push(`Username: ${process.env.TABLEAU_USERNAME}`);
    results.push(`Password: ${process.env.TABLEAU_PASSWORD ? 'Set (length: ' + process.env.TABLEAU_PASSWORD.length + ')' : 'Not set'}`);
    results.push(`Site ID: "${process.env.TABLEAU_SITE_ID || 'Empty (default site)'}"`);
    results.push('');

    // Test 1: Server connectivity
    results.push('1. Testing server connectivity...');
    
    const serverResponse = await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/serverinfo`);
    if (serverResponse.ok) {
      const serverInfo = await serverResponse.json();
      results.push(`✓ Server reachable - Version: ${serverInfo.serverInfo.productVersion}`);
    } else {
      results.push(`✗ Server not reachable: ${serverResponse.status}`);
      return NextResponse.json({ results: results.join('\n') });
    }
    results.push('');

    // Test 2: Authentication without site ID
    results.push('2. Testing authentication (default site)...');
    
    const authPayload1 = {
      credentials: {
        name: process.env.TABLEAU_USERNAME,
        password: process.env.TABLEAU_PASSWORD
      }
    };

    const authResponse1 = await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authPayload1)
    });

    if (authResponse1.ok) {
      const authData1 = await authResponse1.json();
      results.push('✓ Authentication successful (default site)');
      results.push(`  Site ID: ${authData1.credentials.site.id}`);
      results.push(`  Site Content URL: "${authData1.credentials.site.contentUrl}"`);
      results.push(`  User ID: ${authData1.credentials.user.id}`);
      results.push(`  User Name: ${authData1.credentials.user.name}`);
      
      // Test workbooks
      results.push('');
      results.push('3. Testing workbooks access...');
      
      const workbooksResponse = await fetch(
        `${process.env.TABLEAU_SERVER_URL}/api/3.19/sites/${authData1.credentials.site.id}/workbooks`,
        {
          headers: {
            'X-Tableau-Auth': authData1.credentials.token
          }
        }
      );

      if (workbooksResponse.ok) {
        const workbooksData = await workbooksResponse.json();
        const workbooks = workbooksData.workbooks?.workbook || [];
        results.push(`✓ Found ${workbooks.length} workbooks`);
        
        if (workbooks.length > 0) {
          results.push('  Workbooks:');
          workbooks.slice(0, 10).forEach((wb: any) => {
            results.push(`    - ${wb.name} (${wb.contentUrl})`);
          });
        } else {
          results.push('  No workbooks found. You may need to publish workbooks first.');
        }
      } else {
        const errorText = await workbooksResponse.text();
        results.push(`✗ Failed to get workbooks: ${workbooksResponse.status}`);
        results.push(`  Error: ${errorText}`);
      }

      // Sign out
      await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signout`, {
        method: 'POST',
        headers: {
          'X-Tableau-Auth': authData1.credentials.token
        }
      });
      results.push('');
      results.push('✓ Signed out successfully');

    } else {
      const errorText1 = await authResponse1.text();
      results.push(`✗ Default site authentication failed: ${authResponse1.status}`);
      results.push(`Error: ${errorText1}`);
      
      // Test 3: Try with site ID if provided
      if (process.env.TABLEAU_SITE_ID && process.env.TABLEAU_SITE_ID !== '') {
        results.push('');
        results.push(`3. Testing with site ID: "${process.env.TABLEAU_SITE_ID}"...`);
        
        const authPayload2 = {
          credentials: {
            name: process.env.TABLEAU_USERNAME,
            password: process.env.TABLEAU_PASSWORD,
            site: {
              contentUrl: process.env.TABLEAU_SITE_ID
            }
          }
        };

        const authResponse2 = await fetch(`${process.env.TABLEAU_SERVER_URL}/api/3.19/auth/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(authPayload2)
        });

        if (authResponse2.ok) {
          const authData2 = await authResponse2.json();
          results.push('✓ Authentication with site ID successful');
          results.push(`  Site ID: ${authData2.credentials.site.id}`);
          results.push(`  Site Content URL: "${authData2.credentials.site.contentUrl}"`);
        } else {
          const errorText2 = await authResponse2.text();
          results.push(`✗ Site ID authentication failed: ${authResponse2.status}`);
          results.push(`Error: ${errorText2}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      results: results.join('\n') 
    });

  } catch (error) {
    results.push(`✗ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ 
      success: false,
      results: results.join('\n') 
    });
  }
}