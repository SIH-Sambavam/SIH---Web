"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Calendar, Fish, Waves, MapPin, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MarineStats {
  overview: {
    totalOccurrences: number;
    uniqueSpecies: number;
    totalLocations: number;
    totalHabitats: number;
  };
  topSpecies: Array<{
    scientificName: string;
    name: string;
    occurrenceCount: number;
    locationCount: number;
  }>;
  habitatDistribution: Array<{
    habitat: string;
    count: number;
  }>;
  localityDistribution: Array<{
    locality: string;
    count: number;
  }>;
  depthStatistics: {
    averageMinDepth: number;
    averageMaxDepth: number;
    minRecordedDepth: number;
    maxRecordedDepth: number;
  } | null;
}

export default function AnalyticsPage() {
  const [selectedDashboard, setSelectedDashboard] = useState('overview');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [stats, setStats] = useState<MarineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarineStats();
  }, []);

  const fetchMarineStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fish/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch marine statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const dashboards = [
    {
      id: 'overview',
      name: 'Species Overview',
      description: 'General marine species statistics and trends',
      icon: BarChart3
    },
    {
      id: 'geographic',
      name: 'Geographic Distribution',
      description: 'Species distribution across different regions',
      icon: MapPin
    },
    {
      id: 'habitats',
      name: 'Habitat Analysis',
      description: 'Habitat distribution and depth analysis',
      icon: Waves
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        dateRange: dateRange === 'custom' ? '2020-01-01,2024-12-31' : dateRange
      });
      
      const response = await fetch(`/api/tableau/data-export?${params}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marine_species_${dateRange}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marine_species_${dateRange}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marine Species Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Real-time analytics from your marine biodiversity database
          </p>
          {loading && (
            <div className="flex items-center gap-2 mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">Loading marine data...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 mt-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
              <Button variant="outline" size="sm" onClick={fetchMarineStats}>
                Retry
              </Button>
            </div>
          )}
          {stats && !loading && (
            <div className="flex items-center gap-2 mt-2">
              <Fish className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">
                Live data • {stats.overview.totalOccurrences.toLocaleString()} observations
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
              <SelectItem value="all_time">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportData('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading marine species data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchMarineStats}>Try Again</Button>
          </div>
        </div>
      ) : (
        <Tabs value={selectedDashboard} onValueChange={setSelectedDashboard} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;
              return (
                <TabsTrigger key={dashboard.id} value={dashboard.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {dashboard.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Marine Species</CardTitle>
                <CardDescription>Most frequently observed species</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.topSpecies || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="occurrenceCount" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Species Distribution</CardTitle>
                <CardDescription>Occurrence count by species</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.topSpecies || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="occurrenceCount"
                    >
                      {stats?.topSpecies?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Species occurrences by location</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats?.localityDistribution?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="locality" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habitats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Habitat Distribution</CardTitle>
                <CardDescription>Species count by habitat type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.habitatDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ habitat, percent }) => `${habitat} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats?.habitatDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Depth Statistics</CardTitle>
                <CardDescription>Marine species depth distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.depthStatistics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.depthStatistics.averageMinDepth}m
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Min Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-800">
                          {stats.depthStatistics.averageMaxDepth}m
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Max Depth</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {stats.depthStatistics.minRecordedDepth}m
                        </div>
                        <div className="text-sm text-muted-foreground">Shallowest</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">
                          {stats.depthStatistics.maxRecordedDepth}m
                        </div>
                        <div className="text-sm text-muted-foreground">Deepest</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">No depth data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        </Tabs>
      )}

      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalOccurrences.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Marine species records</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unique Species</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.overview.uniqueSpecies.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Different species identified</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Geographic Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.overview.totalLocations}</div>
              <p className="text-xs text-muted-foreground">Observation sites</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Habitat Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.overview.totalHabitats}</div>
              <p className="text-xs text-muted-foreground">Different ecosystems</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}