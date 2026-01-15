import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, Download, Eye, MoreHorizontal, FileText, Link, Video, Loader2, BookOpen, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { commonApi, Resource, ResourceRequest } from '@/lib/api';
import { tutorApi, TutorClass } from '@/lib/api';

export default function TutorResources() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [myClasses, setMyClasses] = useState<TutorClass[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'fulfilled'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document' as 'document' | 'link' | 'pdf' | 'video',
    category: '',
    tags: '',
    url: '',
    classId: '',
    is_public: false,
  });

  // Load resources and classes on component mount
  useEffect(() => {
    loadClasses();
    loadResources();
    loadResourceRequests();
  }, []);

  // Reload resources when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadResources();
    }, searchTerm ? 500 : 0); // Debounce search by 500ms

    return () => clearTimeout(timeoutId);
  }, [selectedType, selectedClass, searchTerm]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const params: {
        type?: string;
        class_id?: number;
        search?: string;
      } = {};

      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      if (selectedClass !== 'all') {
        params.class_id = parseInt(selectedClass);
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const data = await commonApi.resources.list(params);
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classes = await tutorApi.getClasses();
      setMyClasses(classes);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadResourceRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const requests = await commonApi.resourceRequests.list({ status: 'pending' });
      setResourceRequests(requests);
    } catch (error) {
      console.error('Failed to load resource requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resource requests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest) return;

    try {
      await commonApi.resourceRequests.update(selectedRequest.id, {
        status: reviewStatus,
        review_notes: reviewNotes || undefined,
      });

      toast({
        title: 'Request Updated',
        description: `Resource request has been ${reviewStatus}.`,
      });

      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      setReviewStatus('approved');
      await loadResourceRequests();
    } catch (error) {
      console.error('Failed to update resource request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update resource request.',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return FileText;
      case 'video':
        return Video;
      case 'link':
        return Link;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'video':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'link':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatFileSize = (bytes?: number): string | null => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const normalizeTags = (tags?: string[] | string | null): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      // Handle comma-separated string
      return tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return [];
  };

  const handleUploadResource = async () => {
    if (!newResource.title || !newResource.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (newResource.type === 'link' && !newResource.url) {
      toast({
        title: "Missing Information",
        description: "Please provide a URL for link resources.",
        variant: "destructive",
      });
      return;
    }

    if (newResource.type !== 'link' && !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      await commonApi.resources.create({
        title: newResource.title,
        description: newResource.description || undefined,
        type: newResource.type,
        category: newResource.category || undefined,
        class_id: newResource.classId ? parseInt(newResource.classId) : undefined,
        url: newResource.type === 'link' ? newResource.url : undefined,
        file: newResource.type !== 'link' ? selectedFile! : undefined,
        is_public: newResource.is_public,
      });

      toast({
        title: "Resource Added",
        description: "Your resource has been uploaded successfully.",
      });

      // Reset form
      setNewResource({
        title: '',
        description: '',
        type: 'document',
        category: '',
        tags: '',
        url: '',
        classId: '',
        is_public: false,
      });
      setSelectedFile(null);
      setIsUploadOpen(false);
      
      // Reload resources
      await loadResources();
    } catch (error) {
      console.error('Failed to upload resource:', error);
      toast({
        title: "Error",
        description: "Failed to upload resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      if (resource.type === 'link') {
        window.open(resource.url, '_blank');
        return;
      }

      const blob = await commonApi.resources.download(resource.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `Downloading ${resource.title}`,
      });

      // Reload resources to update download count
      await loadResources();
    } catch (error) {
      console.error('Failed to download resource:', error);
      toast({
        title: "Error",
        description: "Failed to download resource. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (resource: Resource) => {
    try {
      await commonApi.resources.delete(resource.id);
      toast({
        title: "Resource Deleted",
        description: "Resource has been deleted successfully.",
      });
      await loadResources();
    } catch (error) {
      console.error('Failed to delete resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: resources.length,
    public: resources.filter(r => r.is_public).length,
    private: resources.filter(r => !r.is_public).length,
    totalDownloads: resources.reduce((acc, r) => acc + (r.downloads || 0), 0)
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Manage and share educational resources with your students
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
              <DialogDescription>
                Upload or link to educational resources for your students
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Resource Title *</Label>
                <Input
                  id="title"
                  value={newResource.title}
                  onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., React Hooks Cheat Sheet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Resource Type *</Label>
                <Select value={newResource.type} onValueChange={(value: 'document' | 'link' | 'pdf' | 'video') => setNewResource(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the resource"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newResource.category}
                    onChange={(e) => setNewResource(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Reference, Tutorial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class (Optional)</Label>
                  <Select value={newResource.classId === 'none' || !newResource.classId ? undefined : newResource.classId} onValueChange={(value) => setNewResource(prev => ({ ...prev, classId: value === 'none' ? null : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific class</SelectItem>
                      {myClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newResource.tags}
                  onChange={(e) => setNewResource(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., react, hooks, javascript"
                />
              </div>

              {newResource.type === 'link' && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {newResource.type !== 'link' && (
                <div className="space-y-2">
                  <Label>File Upload *</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      type="file"
                      accept={newResource.type === 'pdf' ? '.pdf' : newResource.type === 'video' ? 'video/*' : '*'}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="mt-2"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newResource.is_public}
                  onChange={(e) => setNewResource(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="public" className="text-sm">
                  Make this resource publicly accessible to all students
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsUploadOpen(false);
                setSelectedFile(null);
              }}>Cancel</Button>
              <Button onClick={handleUploadResource} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Add Resource'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.public}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Private Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.private}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="requests">
            Resource Requests
            {resourceRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500">{resourceRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="link">Links</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {myClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resources Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : resources.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => {
                const IconComponent = getTypeIcon(resource.type);
                const classData = myClasses.find(cls => cls.id === resource.class_id);
                return (
                  <Card key={resource.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                          <Badge className={getTypeColor(resource.type)}>
                            {resource.type}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleDownload(resource)}>
                              <Download className="mr-2 h-4 w-4" />
                              {resource.type === 'link' ? 'Open' : 'Download'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(resource)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="font-semibold mb-2">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {resource.description || 'No description'}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {resource.category && <span>Category: {resource.category}</span>}
                          {formatFileSize(resource.file_size) && <span>{formatFileSize(resource.file_size)}</span>}
                        </div>
                        
                        {classData && (
                          <div className="text-xs text-muted-foreground">
                            Class: {classData.name}
                          </div>
                        )}

                        {(() => {
                          const tags = normalizeTags(resource.tags);
                          return tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {resource.downloads || 0} downloads
                        </div>
                        <Button size="sm" onClick={() => handleDownload(resource)}>
                          <Download className="mr-2 h-4 w-4" />
                          {resource.type === 'link' ? 'Open' : 'Download'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No resources found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-uploads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Uploaded</CardTitle>
              <CardDescription>Resources you've added recently</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : resources.length > 0 ? (
                <div className="space-y-4">
                  {resources.slice(0, 5).map((resource) => {
                    const IconComponent = getTypeIcon(resource.type);
                    return (
                      <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{resource.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(resource.created_at).toLocaleDateString()} • {resource.downloads || 0} downloads
                            </p>
                          </div>
                        </div>
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No resources uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Resource Requests
              </CardTitle>
              <CardDescription>
                Review and manage resource requests from students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : resourceRequests.length > 0 ? (
                <div className="space-y-4">
                  {resourceRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <CardDescription>
                              Requested by {request.requestedBy?.name || 'Unknown'} • {new Date(request.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{request.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Category:</p>
                          <p className="text-sm text-muted-foreground">{request.category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Type:</p>
                          <p className="text-sm text-muted-foreground">{request.type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Description:</p>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewStatus('approved');
                                setIsReviewDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewStatus('rejected');
                                setIsReviewDialogOpen(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewStatus('fulfilled');
                                setIsReviewDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Fulfilled
                            </Button>
                          </div>
                        )}
                        {request.review_notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-1">Review Notes:</p>
                            <p className="text-sm text-muted-foreground">{request.review_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending resource requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewStatus === 'approved' && 'Approve Resource Request'}
              {reviewStatus === 'rejected' && 'Reject Resource Request'}
              {reviewStatus === 'fulfilled' && 'Mark Request as Fulfilled'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>Review request: {selectedRequest.title}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-notes">Review Notes (Optional)</Label>
              <Textarea
                id="review-notes"
                placeholder="Add any notes about this decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewRequest}>
              {reviewStatus === 'approved' && 'Approve'}
              {reviewStatus === 'rejected' && 'Reject'}
              {reviewStatus === 'fulfilled' && 'Mark as Fulfilled'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}