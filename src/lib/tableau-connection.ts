// Tableau connection utilities and testing
export interface TableauConfig {
  serverUrl: string;
  siteId?: string;
  username?: string;
  personalAccessToken?: string;
  tokenName?: string;
}

export class TableauConnection {
  private config: TableauConfig;

  constructor(config: TableauConfig) {
    this.config = config;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test basic server connectivity
      const response = await fetch(`${this.config.serverUrl}/api/3.19/serverinfo`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Server not reachable: ${response.status} ${response.statusText}`
        };
      }

      const serverInfo = await response.json();
      
      return {
        success: true,
        message: `Connected to Tableau Server ${serverInfo.serverInfo.productVersion}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getWorkbooks(): Promise<any[]> {
    try {
      // First authenticate
      const authResponse = await fetch('/api/tableau/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'current_user' })
      });

      if (!authResponse.ok) {
        throw new Error('Authentication failed');
      }

      const { token } = await authResponse.json();

      // Get workbooks list
      const workbooksResponse = await fetch(
        `${this.config.serverUrl}/api/3.19/sites/${this.config.siteId}/workbooks`,
        {
          headers: {
            'X-Tableau-Auth': token
          }
        }
      );

      const data = await workbooksResponse.json();
      return data.workbooks?.workbook || [];
    } catch (error) {
      console.error('Failed to fetch workbooks:', error);
      return [];
    }
  }
}

// Utility function to validate Tableau configuration
export function validateTableauConfig(): { valid: boolean; missing: string[] } {
  const required = ['TABLEAU_SERVER_URL', 'NEXT_PUBLIC_TABLEAU_SERVER_URL'];
  const missing: string[] = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Check for at least one authentication method
  const hasAuth = process.env.TABLEAU_PERSONAL_ACCESS_TOKEN || 
                  process.env.TABLEAU_USERNAME || 
                  process.env.TABLEAU_TRUSTED_USER;

  if (!hasAuth) {
    missing.push('Authentication method (TABLEAU_PERSONAL_ACCESS_TOKEN or TABLEAU_USERNAME or TABLEAU_TRUSTED_USER)');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}