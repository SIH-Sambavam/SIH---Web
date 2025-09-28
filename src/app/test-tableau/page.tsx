"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TestTableauPage() {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    serverUrl: 'https://prod-in-a.online.tableau.com',
    username: '10a19yashwant@gmail.com',
    password: '_M#2!(?dC.ym"/A',
    siteId: ''
  });

  const testDirectAuth = async () => {
    setLoading(true);
    setResults('Testing Tableau authentication via API...\n\n');
    
    try {
      // Test through our API endpoint instead of direct calls
      setResults(prev => prev + '1. Testing authentication through API...\n');
      
      const apiAuthResponse = await fetch('/api/tableau/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'test_user' })
      });

      if (apiAuthResponse.ok) {
        const authData = await apiAuthResponse.json();
        setResults(prev => prev + '✓ API Authentication successful!\n');
        setResults(prev => prev + `  Auth Type: ${authData.authType}\n`);
        setResults(prev => prev + `  Server URL: ${authData.serverUrl}\n`);
        
        if (authData.token) {
          setResults(prev => prev + `  Token: ${authData.token.substring(0, 20)}...\n`);
        }
        if (authData.ticket) {
          setResults(prev => prev + `  Ticket: ${authData.ticket}\n`);
        }
        
        setResults(prev => prev + '\n2. Testing workbooks access...\n');
        
        // Test workbooks through our API
        const workbooksResponse = await fetch('/api/tableau/workbooks');
        if (workbooksResponse.ok) {
          const workbooksData = await workbooksResponse.json();
          setResults(prev => prev + `✓ Found ${workbooksData.length || 0} workbooks\n`);
          
          if (workbooksData.length > 0) {
            workbooksData.slice(0, 5).forEach((wb: any) => {
              setResults(prev => prev + `  - ${wb.name} (${wb.contentUrl || wb.id})\n`);
            });
          } else {
            setResults(prev => prev + '  No workbooks found. You may need to publish workbooks first.\n');
          }
        } else {
          setResults(prev => prev + '✗ Could not fetch workbooks\n');
        }
        
      } else {
        const errorData = await apiAuthResponse.json();
        setResults(prev => prev + `✗ API Authentication failed: ${apiAuthResponse.status}\n`);
        setResults(prev => prev + `Error: ${errorData.error}\n`);
      }

    } catch (error) {
      setResults(prev => prev + `✗ Test failed: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testAPIEndpoint = async () => {
    setLoading(true);
    setResults('Running comprehensive Tableau test...\n\n');
    
    try {
      const response = await fetch('/api/tableau/debug');
      const result = await response.json();
      
      setResults(result.results);
      
    } catch (error) {
      setResults(prev => prev + `Debug test failed: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Tableau Connection Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>Test your Tableau Online credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serverUrl">Server URL</Label>
              <Input
                id="serverUrl"
                value={credentials.serverUrl}
                onChange={(e) => setCredentials(prev => ({ ...prev, serverUrl: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="siteId">Site ID (optional)</Label>
              <Input
                id="siteId"
                value={credentials.siteId}
                onChange={(e) => setCredentials(prev => ({ ...prev, siteId: e.target.value }))}
                placeholder="Leave empty for default site"
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={testDirectAuth} disabled={loading} className="w-full">
                {loading ? 'Testing...' : 'Test Direct Authentication'}
              </Button>
              
              <Button onClick={testAPIEndpoint} disabled={loading} variant="outline" className="w-full">
                {loading ? 'Testing...' : 'Run Server-Side Test'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Authentication and connection test results</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={results}
              readOnly
              className="min-h-[400px] font-mono text-sm"
              placeholder="Click 'Test Direct Authentication' to start testing..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}