import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Library, 
  FileText, 
  Video, 
  Headphones, 
  ExternalLink, 
  Search, 
  Filter, 
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentService } from '@/lib/mocks/parent';
import type { ParentResource } from '@/lib/store/parentStore';

export default function ParentResources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  
  const {
    activeChild,
    resources,
    isLoading,
  } = useParentContext();

  const {
    setResources,
    setLoading,
  } = useParentStore();

  // Load resources when active child changes
  useEffect(() => {
    if (!activeChild?.id) return;

    const loadResources = async () => {
      try {
        setLoading(true);
        const resourcesData = await parentService.getResourcesForChild(activeChild.id);
        setResources(resourcesData);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [activeChild?.id, setResources, setLoading]);

  // Get unique values for filters
  const subjects = [...new Set(resources?.map(r => r.subject) || [])];
  const allTags = [...new Set(resources?.flatMap(r => r.tags) || [])];

  // Filter resources
  const filteredResources = resources?.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    const matchesSubject = subjectFilter === 'all' || resource.subject === subjectFilter;
    const matchesTag = tagFilter === 'all' || resource.tags.includes(tagFilter);
    return matchesSearch && matchesType && matchesSubject && matchesTag;
  }) || [];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'video': return Video;
      case 'recording': return Headphones;
      case 'link': return ExternalLink;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'default';
      case 'video': return 'secondary';
      case 'recording': return 'outline';
      case 'link': return 'destructive';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleResourceClick = (resource: ParentResource) => {
    // In a real app, this would handle different resource types appropriately
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else {
      // For documents, videos, recordings - would typically open in a modal or new tab
      console.log('Opening resource:', resource.title);
    }
  };

  if (!activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
            <p className="text-muted-foreground">Please select a child to view their resources.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            Course materials and educational resources for {activeChild.name}
          </p>
        </div>
        <ChildSwitcher />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Available materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources?.filter(r => r.type === 'document').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">PDFs and guides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources?.filter(r => r.type === 'video' || r.type === 'recording').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Video content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">Different courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="recording">Recordings</SelectItem>
            <SelectItem value="link">Links</SelectItem>
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const ResourceIcon = getResourceIcon(resource.type);
            
            return (
              <Card key={resource.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <ResourceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{resource.title}</CardTitle>
                        <CardDescription>{resource.subject}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={getTypeColor(resource.type)} className="ml-2">
                      {resource.type}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Uploaded: {formatDate(resource.uploadDate)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleResourceClick(resource)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    
                    {resource.type === 'document' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleResourceClick(resource)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    <span className="inline-flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      View-only access
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || typeFilter !== 'all' || subjectFilter !== 'all' || tagFilter !== 'all'
                ? 'No resources match your current filters.' 
                : `No resources are available for ${activeChild.name} yet.`}
            </p>
            {(searchTerm || typeFilter !== 'all' || subjectFilter !== 'all' || tagFilter !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setSubjectFilter('all');
                  setTagFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resource Categories */}
      {filteredResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Categories</CardTitle>
            <CardDescription>Browse by subject and type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">By Subject</h4>
                <div className="space-y-2">
                  {subjects.map(subject => {
                    const count = resources?.filter(r => r.subject === subject).length || 0;
                    return (
                      <div key={subject} className="flex items-center justify-between">
                        <span className="text-sm">{subject}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">By Type</h4>
                <div className="space-y-2">
                  {['document', 'video', 'recording', 'link'].map(type => {
                    const count = resources?.filter(r => r.type === type).length || 0;
                    if (count === 0) return null;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type}s</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
