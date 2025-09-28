// Test Tableau connection
const fetch = require('node-fetch');

async function testTableauConnection() {
  const serverUrl = 'https://prod-in-a.online.tableau.com';
  const siteId = '10a19yashwant-128b6c897b';
  const username = '10a19yashwant@gmail.com';
  const password = '_M#2!(?dC.ym"/A';

  console.log('Testing Tableau Online connection...');
  console.log('Server URL:', serverUrl);
  console.log('Site ID:', siteId);
  console.log('Username:', username);

  try {
    // Test server info endpoint
    console.log('\n1. Testing server connectivity...');
    const serverInfoResponse = await fetch(`${serverUrl}/api/3.19/serverinfo`);
    
    if (serverInfoResponse.ok) {
      const serverInfo = await serverInfoResponse.json();
      console.log('✓ Server is reachable');
      console.log('  Product Version:', serverInfo.serverInfo.productVersion);
    } else {
      console.log('✗ Server not reachable:', serverInfoResponse.status);
      return;
    }

    // Test authentication
    console.log('\n2. Testing authentication...');
    const authResponse = await fetch(`${serverUrl}/api/3.19/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials: {
          name: username,
          password: password,
          site: {
            contentUrl: siteId
          }
        }
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✓ Authentication successful');
      console.log('  Token:', authData.credentials.token.substring(0, 20) + '...');
      console.log('  Site ID:', authData.credentials.site.id);
      console.log('  User ID:', authData.credentials.user.id);

      // Test getting workbooks
      console.log('\n3. Testing workbooks access...');
      const workbooksResponse = await fetch(
        `${serverUrl}/api/3.19/sites/${authData.credentials.site.id}/workbooks`,
        {
          headers: {
            'X-Tableau-Auth': authData.credentials.token
          }
        }
      );

      if (workbooksResponse.ok) {
        const workbooksData = await workbooksResponse.json();
        const workbooks = workbooksData.workbooks?.workbook || [];
        console.log('✓ Workbooks access successful');
        console.log(`  Found ${workbooks.length} workbooks:`);
        
        workbooks.slice(0, 5).forEach(wb => {
          console.log(`    - ${wb.name} (${wb.contentUrl})`);
        });
      } else {
        console.log('✗ Failed to get workbooks:', workbooksResponse.status);
        const errorText = await workbooksResponse.text();
        console.log('  Error:', errorText);
      }

      // Sign out
      await fetch(`${serverUrl}/api/3.19/auth/signout`, {
        method: 'POST',
        headers: {
          'X-Tableau-Auth': authData.credentials.token
        }
      });
      console.log('\n✓ Signed out successfully');

    } else {
      console.log('✗ Authentication failed:', authResponse.status);
      const errorText = await authResponse.text();
      console.log('  Error:', errorText);
    }

  } catch (error) {
    console.error('✗ Connection test failed:', error.message);
  }
}

testTableauConnection();