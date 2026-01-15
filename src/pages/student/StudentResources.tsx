import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, Download, Search, FileText, Video, Link, BookOpen, Star, Loader2, BarChart3, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useFavoritesStore } from '@/lib/store/favoritesStore';
import { useToast } from '@/hooks/use-toast';
import { ResourceRequestModal } from '@/components/modals/ResourceRequestModal';
import { ResourcePreviewModal } from '@/components/modals/ResourcePreviewModal';
import { commonApi, ResourceRequest, Resource } from '@/lib/api';
import { studentApi } from '@/lib/api';
import { apiClient } from '@/lib/api/client';

// Component to show related resources for fulfilled requests
const FulfilledRequestResources = ({ 
  request, 
  onDownload, 
  onPreview, 
  onFavorite, 
  isFavorite 
}: { 
  request: ResourceRequest; 
  onDownload: (resource: any) => void;
  onPreview: (resource: any) => void;
  onFavorite: (resource: any) => void;
  isFavorite: (id: string) => boolean;
}) => {
  const [relatedResources, setRelatedResources] = useState<Resource[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  useEffect(() => {
    const loadRelatedResources = async () => {
      try {
        setIsLoadingRelated(true);
        const params: any = {};
        if (request.category) {
          params.category = request.category;
        }
        if (request.type) {
          // Map request type to resource type if needed
          const typeMap: Record<string, string> = {
            'textbook': 'pdf',
            'video tutorial': 'video',
            'document/guide': 'document',
            'software/tool': 'link',
            'website/link': 'link',
            'practice materials': 'document',
          };
          params.type = typeMap[request.type.toLowerCase()] || request.type.toLowerCase();
        }
        
        const resources = await commonApi.resources.list(params);
        // Filter to show resources that match the request criteria
        const matching = resources.filter((r: Resource) => {
          const categoryMatch = !request.category || r.category?.toLowerCase() === request.category.toLowerCase();
          return categoryMatch;
        });
        setRelatedResources(matching.slice(0, 5)); // Show up to 5 related resources
      } catch (error) {
        console.error('Failed to load related resources:', error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    if (request.status === 'fulfilled') {
      loadRelatedResources();
    }
  }, [request]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'link': return <Link className="h-4 w-4 text-green-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <Library className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Request Fulfilled
          </p>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
          Your resource request has been fulfilled. Related resources are shown below.
        </p>
      </div>

      {isLoadingRelated ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : relatedResources.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Related Resources:</p>
          {relatedResources.map((resource) => (
            <Card key={resource.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(resource.type)}
                      <h4 className="font-medium">{resource.title}</h4>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => onDownload(resource)}>
                    <Download className="mr-2 h-4 w-4" />
                    {resource.type === 'link' ? 'Open' : 'Download'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onFavorite(resource)}>
                    <Star className={`mr-2 h-4 w-4 ${isFavorite(String(resource.id)) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {isFavorite(String(resource.id)) ? 'Favorited' : 'Favorite'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onPreview(resource)}>
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No related resources found. Check the main resources library for available resources.
          </p>
        </div>
      )}
    </div>
  );
};

const StudentResources = () => {
  const { toast } = useToast();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    loadEnrolledClasses();
    if (filterType === 'requests') {
      loadResourceRequests();
    }
  }, [filterType]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filterType, searchQuery]);

  useEffect(() => {
    loadResources();
  }, [filterType, searchQuery, currentPage]);

  const loadEnrolledClasses = async () => {
    try {
      const classes = await studentApi.getClasses({ per_page: 100 });
      setEnrolledClasses(classes);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadResourceRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const requests = await commonApi.resourceRequests.list();
      setResourceRequests(requests);
    } catch (error) {
      console.error('Failed to load resource requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resource requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        per_page: filterType === 'favorites' ? 100 : 10, // Fetch more for favorites to filter client-side
        page: filterType === 'favorites' ? 1 : currentPage, // Always fetch page 1 for favorites
      };
      
      if (filterType !== 'all' && filterType !== 'favorites') {
        params.type = filterType;
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Call API directly to get pagination info
      const apiResponse = await apiClient.get<any>('/resources', params);
      let fetchedResources: any[] = [];
      let paginationData: any = {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
      };

      // Handle nested paginated response structure: response.data.data contains the resources
      // response.data contains pagination metadata
      if (apiResponse.data && apiResponse.data.data) {
        const responseData = apiResponse.data;
        if (Array.isArray(responseData.data)) {
          fetchedResources = responseData.data;
          // Extract pagination from Laravel paginated response
          paginationData = {
            current_page: responseData.current_page || 1,
            last_page: responseData.last_page || 1,
            per_page: responseData.per_page || 10,
            total: responseData.total || 0,
          };
        }
      } else if (Array.isArray(apiResponse.data)) {
        fetchedResources = apiResponse.data;
      }
      
      // Map API resources to component format
      const mappedResources = fetchedResources.map((resource: any) => {
        // Get class name if class_id exists
        const classData = enrolledClasses.find(c => c.id === resource.class_id);
        const className = classData?.name || resource.class?.name || '';
        
        // Parse tags if it's a string
        let tags: string[] = [];
        if (resource.tags) {
          if (Array.isArray(resource.tags)) {
            tags = resource.tags;
          } else if (typeof resource.tags === 'string') {
            tags = resource.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
          }
        }
        
        // Format file size
        const formatFileSize = (bytes: number | undefined) => {
          if (!bytes) return null;
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        };

        return {
          id: String(resource.id),
          resourceId: resource.id, // Store numeric ID for API calls
          title: resource.title,
          description: resource.description || '',
          type: resource.type,
          category: resource.category || '',
          class: className,
          uploadedBy: resource.uploaded_by_user?.name || resource.uploader?.name || 'Unknown',
          uploadDate: resource.created_at,
          downloads: resource.downloads || 0,
          fileSize: formatFileSize(resource.file_size),
          url: resource.url || resource.file_path || '#',
          file_path: resource.file_path, // Store file path for download
          tags: tags,
          rating: 4.5, // Default rating as API doesn't provide this
          _apiResource: resource, // Store original API resource
        };
      });

      // Filter favorites if needed (client-side filtering)
      let finalResources = mappedResources;
      if (filterType === 'favorites') {
        const favoriteIds = favorites.map(f => f.id);
        finalResources = mappedResources.filter(r => favoriteIds.includes(r.id));
        // For favorites, client-side pagination
        const startIndex = (currentPage - 1) * paginationData.per_page;
        const endIndex = startIndex + paginationData.per_page;
        const paginatedFavorites = finalResources.slice(startIndex, endIndex);
        setResources(paginatedFavorites);
        setPagination({
          current_page: currentPage,
          last_page: Math.ceil(finalResources.length / paginationData.per_page) || 1,
          per_page: paginationData.per_page,
          total: finalResources.length,
        });
        return;
      }
      
      setResources(finalResources);
      setPagination(paginationData);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToFavorites = (resource: any) => {
    const resourceId = String(resource.id);
    if (isFavorite(resourceId)) {
      removeFromFavorites(resourceId);
      toast({ title: "Removed from Favorites", description: `${resource.title} removed from favorites.` });
    } else {
      addToFavorites({
        id: resourceId,
        title: resource.title,
        type: resource.type,
        category: resource.category || '',
      });
      toast({ title: "Added to Favorites", description: `${resource.title} saved to favorites.` });
    }
    
    // Reload resources if on favorites tab
    if (filterType === 'favorites') {
      loadResources();
    }
  };

  const handlePreview = (resource: any) => {
    setSelectedResource(resource);
    setPreviewModalOpen(true);
  };

  const handleDownload = async (resource: any) => {
    try {
      // Handle links - just open in new tab
      if (resource.type === 'link') {
        if (resource.url && resource.url !== '#') {
          window.open(resource.url, '_blank');
          toast({
            title: "Link Opened",
            description: `Opening ${resource.title} in a new tab...`,
          });
        } else {
          toast({
            title: "Error",
            description: "Link URL is not available",
            variant: 'destructive',
          });
        }
        return;
      }

      // Get the resource ID - try multiple sources
      const resourceId = resource.resourceId || resource._apiResource?.id || resource.id;
      
      if (!resourceId) {
        toast({
          title: "Error",
          description: "Resource ID not available",
          variant: 'destructive',
        });
        return;
      }

      // If we have a direct file path/URL, try to download it directly first
      if (resource.file_path || resource.url) {
        const fileUrl = resource.file_path || resource.url;
        if (fileUrl && fileUrl !== '#' && !fileUrl.startsWith('http')) {
          // Relative path - construct full URL
          const baseURL = apiClient.getBaseURL().replace('/api/v1', '');
          const fullUrl = fileUrl.startsWith('/') 
            ? `${baseURL}${fileUrl}` 
            : `${baseURL}/storage/${fileUrl}`;
          
          // Try direct download first
          try {
            const a = document.createElement('a');
            a.href = fullUrl;
            a.download = resource.title || 'resource';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast({ 
              title: "Download Started", 
              description: `Downloading ${resource.title}...` 
            });
            
            // Reload resources to update download count
            loadResources();
            return;
          } catch (directError) {
            console.log('Direct download failed, trying API:', directError);
            // Fall through to API download
          }
        } else if (fileUrl && fileUrl.startsWith('http')) {
          // External URL - open directly
          window.open(fileUrl, '_blank');
          toast({
            title: "Download Started",
            description: `Opening ${resource.title}...`,
          });
          return;
        }
      }

      // Use API download endpoint
      const blob = await commonApi.resources.download(Number(resourceId));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get file extension from original filename or type
      const fileExtension = resource.type === 'pdf' ? '.pdf' : 
                           resource.type === 'video' ? '.mp4' :
                           resource.type === 'document' ? '.doc' : '';
      a.download = `${resource.title}${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ 
        title: "Download Started", 
        description: `Downloading ${resource.title}...` 
      });
      
      // Reload resources to update download count
      loadResources();
    } catch (error: any) {
      console.error('Download failed:', error);
      const errorMessage = error?.message || 'Failed to download resource';
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Calculate stats
  const categories = [...new Set(resources.map(r => r.category).filter(Boolean))];
  const classes = [...new Set(resources.map(r => r.class).filter(Boolean))];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'link': return <Link className="h-4 w-4 text-green-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <Library className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'link': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({length: 5}, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Library</h1>
          <p className="text-muted-foreground">
            Access course materials, textbooks, and learning resources
          </p>
        </div>
        <Button onClick={() => setRequestModalOpen(true)}>
          <BookOpen className="mr-2 h-4 w-4" />
          Request Resource
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-muted-foreground">Available to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Subject areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Your enrolled classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favorites.length}</div>
            <p className="text-xs text-muted-foreground">Saved resources</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources by title, type, or tags..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={filterType} onValueChange={setFilterType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="pdf">PDFs</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
          <TabsTrigger value="link">Links</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="requests">
            My Requests
            {resourceRequests.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-yellow-500">{resourceRequests.filter(r => r.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No resources found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        {resource.title}
                      </CardTitle>
                      <CardDescription>
                        {resource.class} • Uploaded by {resource.uploadedBy}
                      </CardDescription>
                    </div>
                    <Badge className={getTypeColor(resource.type)}>
                      {resource.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span>{resource.downloads} downloads</span>
                      </div>
                      {resource.fileSize && (
                        <div>
                          <span className="font-medium">Size: {resource.fileSize}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {renderStars(resource.rating)}
                        <span className="ml-1 text-muted-foreground">({resource.rating})</span>
                      </div>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(resource.uploadDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="mr-2 h-4 w-4" />
                      {resource.type === 'link' ? 'Open Link' : 'Download'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSaveToFavorites(resource)}>
                      <Star className={`mr-2 h-4 w-4 ${isFavorite(resource.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {isFavorite(resource.id) ? 'Remove Favorite' : 'Save to Favorites'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePreview(resource)}>
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.filter(r => r.type === 'pdf').length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No PDF resources found.</p>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {resources.filter(r => r.type === 'pdf').map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        {resource.title}
                      </CardTitle>
                      <CardDescription>
                        {resource.class} • {resource.fileSize}
                      </CardDescription>
                    </div>
                    <Badge className={getTypeColor(resource.type)}>
                      {resource.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePreview(resource)}>
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.filter(r => r.type === 'video').length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No video resources found.</p>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {resources.filter(r => r.type === 'video').map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        {resource.title}
                      </CardTitle>
                      <CardDescription>
                        {resource.class} • {resource.fileSize}
                      </CardDescription>
                    </div>
                    <Badge className={getTypeColor(resource.type)}>
                      {resource.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => resource.url && resource.url !== '#' ? window.open(resource.url, '_blank') : handlePreview(resource)}>
                      <Video className="mr-2 h-4 w-4" />
                      Watch Video
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.filter(r => r.type === 'document').length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No document resources found.</p>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {resources.filter(r => r.type === 'document').map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(resource.type)}
                    {resource.title}
                  </CardTitle>
                  <CardDescription>{resource.class}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <Button size="sm" onClick={() => handleDownload(resource)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Document
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.filter(r => r.type === 'link').length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No link resources found.</p>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {resources.filter(r => r.type === 'link').map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(resource.type)}
                    {resource.title}
                  </CardTitle>
                  <CardDescription>{resource.class}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <Button size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <Link className="mr-2 h-4 w-4" />
                      Open Link
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resources.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Favorites Yet</CardTitle>
                <CardDescription>
                  Save resources to your favorites for quick access later.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <Star className="mr-2 h-4 w-4" />
                  Browse Resources
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {getTypeIcon(resource.type)}
                          {resource.title}
                        </CardTitle>
                        <CardDescription>
                          {resource.class || resource.category} • Uploaded by {resource.uploadedBy}
                        </CardDescription>
                      </div>
                      <Badge className={getTypeColor(resource.type)}>
                        {resource.type.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span>{resource.downloads} downloads</span>
                        </div>
                        {resource.fileSize && (
                          <div>
                            <span className="font-medium">Size: {resource.fileSize}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(resource.uploadDate).toLocaleDateString()}
                      </span>
                    </div>

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleDownload(resource)}>
                        <Download className="mr-2 h-4 w-4" />
                        {resource.type === 'link' ? 'Open Link' : 'Download'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSaveToFavorites(resource)}>
                        <Star className={`mr-2 h-4 w-4 ${isFavorite(String(resource.id)) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        {isFavorite(String(resource.id)) ? 'Remove Favorite' : 'Save to Favorites'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePreview(resource)}>
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {isLoadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resourceRequests.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Resource Requests
                </CardTitle>
                <CardDescription>
                  You haven't submitted any resource requests yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setRequestModalOpen(true)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Request a Resource
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resourceRequests.map((request) => {
                const getStatusIcon = () => {
                  switch (request.status) {
                    case 'approved':
                      return <CheckCircle className="h-4 w-4 text-green-500" />;
                    case 'rejected':
                      return <XCircle className="h-4 w-4 text-red-500" />;
                    case 'fulfilled':
                      return <CheckCircle className="h-4 w-4 text-blue-500" />;
                    default:
                      return <Clock className="h-4 w-4 text-yellow-500" />;
                  }
                };

                const getStatusColor = () => {
                  switch (request.status) {
                    case 'approved':
                      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                    case 'rejected':
                      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                    case 'fulfilled':
                      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
                    default:
                      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                  }
                };

                const getPriorityColor = () => {
                  switch (request.priority) {
                    case 'urgent':
                      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                    case 'high':
                      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
                    case 'medium':
                      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                    default:
                      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
                  }
                };

                return (
                  <Card key={request.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            {request.title}
                          </CardTitle>
                          <CardDescription>
                            Requested on {new Date(request.created_at).toLocaleDateString()}
                            {request.reviewed_at && (
                              <> • Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}</>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor()}>
                            {request.priority}
                          </Badge>
                          <Badge className={getStatusColor()}>
                            {getStatusIcon()}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Category:</p>
                          <p className="text-sm text-muted-foreground">{request.category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Type:</p>
                          <p className="text-sm text-muted-foreground capitalize">{request.type}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>

                      {request.review_notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Review Notes:</p>
                          <p className="text-sm text-muted-foreground">{request.review_notes}</p>
                        </div>
                      )}

                      {request.status === 'fulfilled' && (
                        <FulfilledRequestResources 
                          request={request} 
                          onDownload={handleDownload}
                          onPreview={handlePreview}
                          onFavorite={handleSaveToFavorites}
                          isFavorite={isFavorite}
                        />
                      )}

                      {request.status === 'rejected' && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                              Request Rejected
                            </p>
                          </div>
                          {request.review_notes && (
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {request.review_notes}
                            </p>
                          )}
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                              Pending Review
                            </p>
                          </div>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your request is being reviewed by the tutors. You'll be notified once a decision is made.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {!isLoading && resources.length > 0 && pagination.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} resources
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {pagination.current_page} of {pagination.last_page}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
              disabled={currentPage === pagination.last_page || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ResourceRequestModal 
        open={requestModalOpen} 
        onOpenChange={setRequestModalOpen}
        onRequestSubmitted={() => {
          if (filterType === 'requests') {
            loadResourceRequests();
          }
        }}
      />
      
      <ResourcePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        resource={selectedResource}
        onDownload={handleDownload}
        onFavorite={handleSaveToFavorites}
        isFavorite={selectedResource ? isFavorite(selectedResource.id) : false}
      />
    </div>
  );
};

export default StudentResources;