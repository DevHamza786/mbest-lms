import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, Download, Search, FileText, Video, Link, BookOpen, Star } from "lucide-react";
import { useFavoritesStore } from '@/lib/store/favoritesStore';
import { useToast } from '@/hooks/use-toast';
import { ResourceRequestModal } from '@/components/modals/ResourceRequestModal';
import { ResourcePreviewModal } from '@/components/modals/ResourcePreviewModal';

const StudentResources = () => {
  const { toast } = useToast();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const handleSaveToFavorites = (resource: any) => {
    if (isFavorite(resource.id)) {
      removeFromFavorites(resource.id);
      toast({ title: "Removed from Favorites", description: `${resource.title} removed from favorites.` });
    } else {
      addToFavorites({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        category: resource.category,
      });
      toast({ title: "Added to Favorites", description: `${resource.title} saved to favorites.` });
    }
  };

  const handlePreview = (resource: any) => {
    setSelectedResource(resource);
    setPreviewModalOpen(true);
  };

  const handleDownload = (resource: any) => {
    toast({ 
      title: "Download Started", 
      description: `Downloading ${resource.title}...` 
    });
  };
  const resources = [
    {
      id: "1",
      title: "Calculus Fundamentals Textbook",
      description: "Complete textbook covering differential and integral calculus",
      type: "pdf",
      category: "Mathematics",
      class: "Advanced Mathematics",
      uploadedBy: "Mr. Smith",
      uploadDate: "2024-01-10",
      downloads: 156,
      fileSize: "12.4 MB",
      url: "#",
      tags: ["calculus", "textbook", "fundamentals"],
      rating: 4.8
    },
    {
      id: "2", 
      title: "Physics Lab Manual",
      description: "Comprehensive guide for all physics laboratory experiments",
      type: "pdf",
      category: "Physics",
      class: "Physics Fundamentals",
      uploadedBy: "Dr. Johnson", 
      uploadDate: "2024-01-08",
      downloads: 89,
      fileSize: "8.7 MB",
      url: "#",
      tags: ["physics", "lab", "experiments"],
      rating: 4.6
    },
    {
      id: "3",
      title: "Shakespeare Analysis Video Series",
      description: "Detailed video analysis of Hamlet and Macbeth",
      type: "video",
      category: "Literature",
      class: "English Literature",
      uploadedBy: "Ms. Williams",
      uploadDate: "2024-01-12",
      downloads: 234,
      fileSize: "1.2 GB",
      url: "#",
      tags: ["shakespeare", "analysis", "drama"],
      rating: 4.9
    },
    {
      id: "4",
      title: "Python Programming Cheat Sheet",
      description: "Quick reference for Python syntax and common functions",
      type: "document",
      category: "Computer Science",
      class: "Computer Science",
      uploadedBy: "Prof. Davis",
      uploadDate: "2024-01-15",
      downloads: 178,
      fileSize: "2.1 MB", 
      url: "#",
      tags: ["python", "programming", "reference"],
      rating: 4.7
    },
    {
      id: "5",
      title: "Online Math Calculator",
      description: "Advanced calculator for complex mathematical operations",
      type: "link",
      category: "Mathematics",
      class: "Advanced Mathematics",
      uploadedBy: "Mr. Smith",
      uploadDate: "2024-01-09",
      downloads: 67,
      fileSize: null,
      url: "https://calculator.example.com",
      tags: ["calculator", "math", "tool"],
      rating: 4.5
    },
    {
      id: "6",
      title: "Interactive Physics Simulations",
      description: "Browser-based physics simulations for better understanding",
      type: "link", 
      category: "Physics",
      class: "Physics Fundamentals",
      uploadedBy: "Dr. Johnson",
      uploadDate: "2024-01-11",
      downloads: 145,
      fileSize: null,
      url: "https://physics-sim.example.com",
      tags: ["simulation", "interactive", "physics"],
      rating: 4.8
    }
  ];

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

  const categories = [...new Set(resources.map(r => r.category))];
  const classes = [...new Set(resources.map(r => r.class))];

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

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources by title, type, or tags..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="pdf">PDFs</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
          <TabsTrigger value="link">Links</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
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
                    <Button size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Preview", description: `Opening PDF preview for ${resource.title}...` })}>
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
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
                    <Button size="sm">
                      <Video className="mr-2 h-4 w-4" />
                      Watch Video
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
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
                  <Button size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Document
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {favorites.length === 0 ? (
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
              {favorites.map((favorite) => (
                <Card key={favorite.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{favorite.title}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveToFavorites(favorite)}
                      >
                        <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                        Remove
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      {favorite.category} • Added {new Date(favorite.addedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
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

      {/* Modals */}
      <ResourceRequestModal 
        open={requestModalOpen} 
        onOpenChange={setRequestModalOpen} 
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