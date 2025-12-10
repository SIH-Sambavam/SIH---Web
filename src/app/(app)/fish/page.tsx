'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getImageUrl } from "@/lib/data";
import { FishSpeciesCard } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { Loader2, Search, Fish, MapPin, Waves, Map, X } from "lucide-react";
import MapboxMap, { MapPoint } from "@/components/MapboxMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FishApiResponse {
  species: FishSpeciesCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  overview: {
    totalOccurrences: number;
    uniqueSpecies: number;
    totalLocations: number;
    totalHabitats: number;
  };
  habitatDistribution: Array<{ habitat: string; count: number }>;
  localityDistribution: Array<{ locality: string; count: number }>;
}

export default function FishInfoPage() {
  const [fishSpecies, setFishSpecies] = useState<FishSpeciesCard[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedHabitat, setSelectedHabitat] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<FishApiResponse['pagination'] | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchFishData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (selectedHabitat) params.append('habitat', selectedHabitat);
      if (selectedLocality) params.append('locality', selectedLocality);
      if (searchTerm) params.append('scientificName', searchTerm);

      const response = await fetch(`/api/fish?${params}`);
      const data: FishApiResponse = await response.json();
      
      setFishSpecies(data.species);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching fish data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/fish/stats');
      const data: StatsResponse = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMapData = async () => {
    try {
      setMapLoading(true);
      const params = new URLSearchParams({ limit: '200' });
      if (selectedHabitat) params.append('habitat', selectedHabitat);
      if (selectedLocality) params.append('locality', selectedLocality);
      if (searchTerm) params.append('scientificName', searchTerm);

      const response = await fetch(`/api/fish/coordinates?${params}`);
      const data = await response.json();
      
      if (data.coordinates) {
        setMapPoints(data.coordinates);
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setMapLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset to first page when searching
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchFishData();
  }, [page, selectedHabitat, selectedLocality, searchTerm]);

  useEffect(() => {
    fetchStats();
    fetchMapData();
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [selectedHabitat, selectedLocality, searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
  };

  const handleHabitatChange = (value: string) => {
    setSelectedHabitat(value === 'all' ? '' : value);
    setPage(1);
  };

  const handleLocalityChange = (value: string) => {
    setSelectedLocality(value === 'all' ? '' : value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Marine Species Database
        </h1>
        <p className="text-muted-foreground">
          Explore marine species data from our comprehensive occurrence database
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Fish className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.overview.uniqueSpecies}</p>
                  <p className="text-xs text-muted-foreground">Unique Species</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Waves className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.overview.totalOccurrences.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Occurrences</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.overview.totalLocations}</p>
                  <p className="text-xs text-muted-foreground">Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Waves className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.overview.totalHabitats}</p>
                  <p className="text-xs text-muted-foreground">Habitat Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by scientific name... (Press / to focus)"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-10 pr-10"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchInput('');
                setSearchTerm('');
                e.currentTarget.blur();
              }
            }}
          />
          <div className="absolute right-3 top-3 flex items-center gap-1">
            {searchInput !== searchTerm && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>
        </div>
        <Select value={selectedHabitat || 'all'} onValueChange={handleHabitatChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by habitat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Habitats</SelectItem>
            {stats?.habitatDistribution?.map((habitat) => (
              <SelectItem key={habitat.habitat} value={habitat.habitat}>
                {habitat.habitat} ({habitat.count})
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
        <Select value={selectedLocality || 'all'} onValueChange={handleLocalityChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {stats?.localityDistribution?.slice(0, 20).map((locality) => (
              <SelectItem key={locality.locality} value={locality.locality}>
                {locality.locality} ({locality.count})
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Fish className="h-4 w-4" />
            Species Grid
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading species data...</span>
            </div>
          ) : (
        <>
          {/* Search Results Info */}
          {(searchTerm || selectedHabitat || selectedLocality) && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {pagination ? (
                    <>
                      Showing {pagination.total} species
                      {searchTerm && <span> matching "{searchTerm}"</span>}
                      {selectedHabitat && <span> in {selectedHabitat} habitat</span>}
                      {selectedLocality && <span> from {selectedLocality}</span>}
                    </>
                  ) : (
                    'Loading results...'
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearchTerm('');
                    setSelectedHabitat('');
                    setSelectedLocality('');
                    setPage(1);
                  }}
                  className="text-xs"
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {fishSpecies && fishSpecies.length > 0 ? fishSpecies.map((fish) => (
              <Card key={fish.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="relative aspect-video w-full rounded-md overflow-hidden">
                    <Image
                      src={fish.image_links || getImageUrl(fish.imageId)}
                      alt={fish.name}
                      fill
                      style={{ objectFit: "cover" }}
                      data-ai-hint={`${fish.name} fish`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{fish.name}</CardTitle>
                    <Badge
                      variant={
                        fish.stockTrend === "increasing"
                          ? "default"
                          : fish.stockTrend === "decreasing"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize text-xs"
                    >
                      {fish.stockTrend}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm font-medium mb-2">
                    {fish.scientificName}
                  </CardDescription>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Waves className="h-3 w-3" />
                      <span>{fish.habitat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fish className="h-3 w-3" />
                      <span>{fish.occurrenceCount} occurrences</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{fish.depthRange}</span>
                    </div>
                    {fish.locations.length > 0 && (
                      <div className="text-xs">
                        <strong>Locations:</strong> {fish.locations.slice(0, 2).join(', ')}
                        {fish.locations.length > 2 && ` +${fish.locations.length - 2} more`}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/fish/${encodeURIComponent(fish.scientificName)}`}>
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )) : (
              <div className="col-span-full text-center py-12">
                <Fish className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No species found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedHabitat || selectedLocality 
                    ? "Try adjusting your search criteria or filters"
                    : "No species data available"
                  }
                </p>
                {(searchTerm || selectedHabitat || selectedLocality) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                      setSelectedHabitat('');
                      setSelectedLocality('');
                      setPage(1);
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages} ({pagination.total} species)
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" />
                Species Distribution Map
              </CardTitle>
              <CardDescription>
                Interactive map showing marine species occurrence locations
                {mapLoading && <span className="ml-2">Loading map data...</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{mapPoints.length} locations plotted</span>
                  <span>Click markers for details</span>
                </div>
                
                <MapboxMap
                  points={mapPoints}
                  height="600px"
                  clustered={true}
                  style="mapbox://styles/mapbox/satellite-streets-v12"
                  onPointClick={(point) => {
                    console.log('Clicked point:', point);
                  }}
                />
                
                {mapPoints.length === 0 && !mapLoading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No location data available</p>
                    <p>Try adjusting your search filters to see species locations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
