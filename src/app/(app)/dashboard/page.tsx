"use client";

import { VoiceAssistant } from "@/components/voice-assistant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fishSpecies,
  getImageUrl,
  habitatTypes,
  populationIndexes,
  regions,
  seasons,
} from "@/lib/data";
import { 
  Filter, 
  LineChart, 
  Mic, 
  Search, 
  Thermometer, 
  Waves,
  Fish,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Calendar,
  BarChart3,
  Activity,
  Globe,
  Zap,
  Users,
  Target,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import MapboxMap, { MapPoint } from "@/components/MapboxMap";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

type Fish = (typeof fishSpecies)[0];

interface DashboardStats {
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
  habitatDistribution: Array<{ habitat: string; count: number }>;
  localityDistribution: Array<{ locality: string; count: number }>;
  recentActivity: Array<{ date: string; occurrences: number }>;
}

interface MarineData {
  temperature?: number;
  salinity?: number;
  currentSpeed?: number;
  timestamp: string;
  location: string;
}

export default function DashboardPage() {
  const [selectedFish, setSelectedFish] = useState<Fish | null>(fishSpecies[0]);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [marineData, setMarineData] = useState<MarineData[]>([]);
  const [marineLoading, setMarineLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [habitatFilter, setHabitatFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [populationFilter, setPopulationFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");

  const mapDashboardImage = PlaceHolderImages.find(
    (img) => img.id === "map_dashboard"
  );

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, coordinatesResponse] = await Promise.all([
          fetch('/api/fish/stats'),
          fetch('/api/fish/coordinates?limit=100')
        ]);
        
        const statsData = await statsResponse.json();
        const coordinatesData = await coordinatesResponse.json();
        
        setStats(statsData);
        if (coordinatesData.coordinates) {
          setMapPoints(coordinatesData.coordinates);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch marine data
  useEffect(() => {
    const fetchMarineData = async () => {
      try {
        setMarineLoading(true);
        const response = await fetch('/api/copernicus');
        const data = await response.json();
        setMarineData(data);
      } catch (error) {
        console.error('Error fetching marine data:', error);
      } finally {
        setMarineLoading(false);
      }
    };

    fetchMarineData();
  }, []);

  const filteredFish = useMemo(() => {
    return fishSpecies.filter(fish => {
        return (
            (searchQuery === "" || fish.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (habitatFilter === "all" || fish.habitat === habitatFilter)
        );
    });
  }, [searchQuery, habitatFilter]);

  useEffect(() => {
    if (filteredFish.length > 0) {
      setSelectedFish(filteredFish[0]);
    } else {
      setSelectedFish(null);
    }
  }, [filteredFish]);

  // Mock data for enhanced features
  const conservationAlerts = [
    { species: "Bluefin Tuna", status: "Critical", trend: "declining", priority: "high" },
    { species: "Hammerhead Shark", status: "Vulnerable", trend: "stable", priority: "medium" },
    { species: "Sea Turtle", status: "Endangered", trend: "improving", priority: "high" }
  ];

  const researchProjects = [
    { name: "Coral Reef Monitoring", progress: 75, funding: "$2.5M", status: "active" },
    { name: "Deep Sea Exploration", progress: 45, funding: "$1.8M", status: "active" },
    { name: "Migration Tracking", progress: 90, funding: "$3.2M", status: "completing" }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marine Species Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights into marine biodiversity and research</p>
        </div>
        <Button onClick={() => setAssistantOpen(true)}>
          <Mic className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.overview.uniqueSpecies}</p>
                  <p className="text-xs text-muted-foreground">Species Catalogued</p>
                </div>
                <Fish className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+12% this month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.overview.totalOccurrences.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Sightings</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+8% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.overview.totalLocations}</p>
                  <p className="text-xs text-muted-foreground">Research Sites</p>
                </div>
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <Activity className="h-3 w-3 text-orange-600 mr-1" />
                <span className="text-orange-600">3 new sites</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-xs text-muted-foreground">Biodiversity Index</p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">Healthy ecosystem</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marine Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Live Marine Conditions
          </CardTitle>
          <CardDescription>
            Real-time ocean data from key locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marineLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading marine data...</span>
            </div>
          ) : marineData.length > 0 ? (
            <div className="space-y-4">
              {marineData.map((data, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-2">{data.location}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-4 w-4 text-blue-500" />
                      <span>{data.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span>{data.salinity} PSU</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <span>{data.currentSpeed} m/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Unable to load marine data</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Last updated: {marineData.length > 0 ? new Date(marineData[0].timestamp).toLocaleString() : 'Never'}
          </p>
        </CardFooter>
      </Card>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="conservation">Conservation</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Interactive Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Species Distribution Map
                  </CardTitle>
                  <CardDescription>
                    Real-time species occurrence locations across marine environments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MapboxMap
                    points={mapPoints}
                    height="400px"
                    clustered={true}
                    style="mapbox://styles/mapbox/satellite-streets-v12"
                  />
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              {stats?.recentActivity && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Species sightings over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={stats.recentActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="occurrences" stroke="#8884d8" strokeWidth={2} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="conservation" className="space-y-6">
              {/* Conservation Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Conservation Alerts
                  </CardTitle>
                  <CardDescription>Species requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conservationAlerts.map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.priority === 'high' ? 'bg-red-500' : 
                            alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium">{alert.species}</p>
                            <p className="text-sm text-muted-foreground">Status: {alert.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.trend === 'declining' ? 'destructive' : 
                                        alert.trend === 'improving' ? 'default' : 'secondary'}>
                            {alert.trend === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                            {alert.trend === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {alert.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="research" className="space-y-6">
              {/* Research Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Active Research Projects
                  </CardTitle>
                  <CardDescription>Ongoing marine research initiatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {researchProjects.map((project, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">Funding: {project.funding}</p>
                          </div>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Habitat Distribution */}
              {stats?.habitatDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Habitat Distribution</CardTitle>
                    <CardDescription>Species distribution across different marine habitats</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.habitatDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ habitat, percent }) => `${habitat} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {stats.habitatDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Quality</span>
                <div className="flex items-center gap-2">
                  <Progress value={92} className="w-16 h-2" />
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Coverage</span>
                <div className="flex items-center gap-2">
                  <Progress value={78} className="w-16 h-2" />
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Research Activity</span>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">High</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Species */}
          {stats?.topSpecies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="w-5 h-5" />
                  Most Observed Species
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topSpecies.slice(0, 5).map((species, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{species.name}</p>
                          <p className="text-xs text-muted-foreground">{species.locationCount} locations</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{species.occurrenceCount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/fish">View All Species</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Population Decline</p>
                    <p className="text-xs text-muted-foreground">Bluefin Tuna numbers down 15%</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">New Sighting</p>
                    <p className="text-xs text-muted-foreground">Rare species spotted in Bay of Bengal</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Recovery Success</p>
                    <p className="text-xs text-muted-foreground">Coral reef restoration showing progress</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Survey
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Report Sighting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <VoiceAssistant open={isAssistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
