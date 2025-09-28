"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableauDashboardProps {
  workbookUrl: string;
  viewName?: string;
  width?: string;
  height?: string;
  showToolbar?: boolean;
  showTabs?: boolean;
}

export function TableauDashboard({
  workbookUrl,
  viewName,
  width = '100%',
  height = '600px',
  showToolbar = true,
  showTabs = false
}: TableauDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viz, setViz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTableauViz();
    
    return () => {
      if (viz) {
        viz.dispose();
      }
    };
  }, [workbookUrl, viewName]);

  const loadTableauViz = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load Tableau JavaScript API
      if (!window.tableau) {
        await loadTableauAPI();
      }

      if (!containerRef.current) return;

      // Get authentication token
      const authResponse = await fetch('/api/tableau/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'current_user' })
      });
      
      if (!authResponse.ok) {
        throw new Error('Failed to authenticate with Tableau');
      }

      const { ticket, token, serverUrl, authType } = await authResponse.json();
      
      // Configure Tableau options
      const options = {
        width,
        height,
        hideTabs: !showTabs,
        hideToolbar: !showToolbar,
        onFirstInteractive: () => {
          setIsLoading(false);
          toast({
            title: "Dashboard Loaded",
            description: "Tableau dashboard is ready for interaction."
          });
        }
      };

      // Build URL based on authentication type
      let vizUrl: string;
      if (authType === 'trusted' && ticket) {
        vizUrl = `${serverUrl}/trusted/${ticket}/views/${workbookUrl}${viewName ? `/${viewName}` : ''}`;
      } else {
        // For token-based auth, use direct URL and set token in options
        vizUrl = `${serverUrl}/#/views/${workbookUrl}${viewName ? `/${viewName}` : ''}`;
        if (token) {
          options.token = token;
        }
      }
      
      // Initialize Tableau visualization
      const tableauViz = new window.tableau.Viz(containerRef.current, vizUrl, options);
      setViz(tableauViz);

    } catch (err) {
      console.error('Tableau loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Tableau dashboard');
      setIsLoading(false);
    }
  };

  const loadTableauAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="tableau"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `${process.env.NEXT_PUBLIC_TABLEAU_SERVER_URL}/javascripts/api/tableau-2.min.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Tableau API'));
      document.head.appendChild(script);
    });
  };

  const refreshDashboard = () => {
    if (viz) {
      viz.refreshDataAsync().then(() => {
        toast({
          title: "Data Refreshed",
          description: "Dashboard data has been updated."
        });
      });
    }
  };

  const exportToPDF = () => {
    if (viz) {
      viz.showExportPDFDialog();
    }
  };

  const exportToImage = () => {
    if (viz) {
      viz.showExportImageDialog();
    }
  };

  const openInTableau = () => {
    const tableauUrl = `${process.env.NEXT_PUBLIC_TABLEAU_SERVER_URL}/#/views/${workbookUrl}`;
    window.open(tableauUrl, '_blank');
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Dashboard Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadTableauViz} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Marine Species Analytics</CardTitle>
            <CardDescription>Interactive Tableau Dashboard</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshDashboard} disabled={!viz}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!viz}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={openInTableau}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading Tableau Dashboard...</span>
              </div>
            </div>
          )}
          <div 
            ref={containerRef} 
            className="w-full border rounded-lg overflow-hidden"
            style={{ minHeight: height }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Extend Window interface for Tableau API
declare global {
  interface Window {
    tableau: any;
  }
}