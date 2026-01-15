import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Upload, Grid, List, Download, Heart, MoreVertical, Plus, Tag, Loader2, Edit, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { commonApi, apiClient } from '@/lib/api';
import type { Resource } from '@/lib/api/common';

export default function AdminResources() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalResources, setTotalResources] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document' as 'document' | 'link' | 'pdf' | 'video',
    category: '',
    tags: '',
    url: '',
    file: null as File | null,
    is_public: false,
    class_id: '',
  });

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      // Use apiClient for proper error handling
      const response = await apiClient.get<any>('/resources', params);
      
      if (response.success && response.data) {
        // Handle paginated response
        if (response.data.data && Array.isArray(response.data.data)) {
          setResources(response.data.data);
          setTotalResources(response.data.total || 0);
          setLastPage(response.data.last_page || 1);
        } else if (Array.isArray(response.data)) {
          // Handle direct array response
          setResources(response.data);
          setTotalResources(response.data.length);
          setLastPage(1);
        } else {
          setResources([]);
        }
      } else {
        setResources([]);
      }
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to fetch resources';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setResources([]);
      setTotalResources(0);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [currentPage, searchTerm, categoryFilter, typeFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchResources();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique categories and types from resources
  const categories = useMemo(() => {
    const cats = new Set<string>();
    resources.forEach(r => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats);
  }, [resources]);

  const types = useMemo(() => {
    const typs = new Set<string>();
    resources.forEach(r => {
      if (r.type) typs.add(r.type);
    });
    return Array.from(typs);
  }, [resources]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄';
      case 'video': return '🎥';
      case 'pdf': return '📋';
      case 'link': return '🔗';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    try {
      if (!formData.title || !formData.type) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (formData.type === 'link' && !formData.url) {
        toast({
          title: "Validation Error",
          description: "URL is required for link type resources",
          variant: "destructive",
        });
        return;
      }

      if (formData.type !== 'link' && !formData.file) {
        toast({
          title: "Validation Error",
          description: "File is required for this resource type",
          variant: "destructive",
        });
        return;
      }

      const resourceData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category || undefined,
        tags: formData.tags || undefined,
        is_public: formData.is_public,
      };

      if (formData.class_id) {
        resourceData.class_id = parseInt(formData.class_id);
      }

      if (formData.type === 'link') {
        resourceData.url = formData.url;
      } else if (formData.file) {
        resourceData.file = formData.file;
      }

      await commonApi.resources.create(resourceData);
      
      toast({
        title: "Success",
        description: "Resource uploaded successfully",
      });
      
      setUploadDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to upload resource',
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedResource) return;

    try {
      await commonApi.resources.update(selectedResource.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category || undefined,
      });

      toast({
        title: "Success",
        description: "Resource updated successfully",
      });

      setEditDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error: any) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update resource',
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedResource) return;

    try {
      await commonApi.resources.delete(selectedResource.id);
      
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      setSelectedResource(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete resource',
        variant: "destructive",
      });
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
      a.download = resource.title || 'resource';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `Downloading ${resource.title}...`,
      });

      // Refresh to update download count
      fetchResources();
    } catch (error: any) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to download resource',
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'document',
      category: '',
      tags: '',
      url: '',
      file: null,
      is_public: false,
      class_id: '',
    });
    setSelectedResource(null);
  };

  const openEditDialog = (resource: Resource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      category: resource.category || '',
      tags: Array.isArray(resource.tags) ? resource.tags.join(', ') : (resource.tags || ''),
      url: resource.url || '',
      file: null,
      is_public: resource.is_public || false,
      class_id: resource.class_id ? String(resource.class_id) : '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (resource: Resource) => {
    setSelectedResource(resource);
    setDeleteDialogOpen(true);
  };

  const parseTags = (tags: string | string[] | null | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    return [];
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resource Library</h1>
          <p className="text-muted-foreground">
            Manage educational resources, documents, and learning materials
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Resource</DialogTitle>
                <DialogDescription>
                  Add a new educational resource to the library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter resource title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the resource"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: any) => setFormData({ ...formData, type: value, file: null, url: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input 
                      placeholder="Enter category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>
                {formData.type === 'link' ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input 
                      id="url" 
                      type="url"
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Input
                        id="file"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({ ...formData, file });
                          }
                        }}
                      />
                      <Label htmlFor="file" className="cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {formData.file ? formData.file.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, PPT, Video files up to 100MB
                        </p>
                      </Label>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input 
                    id="tags" 
                    placeholder="Enter tags separated by commas"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_public" className="cursor-pointer">Make this resource public</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setUploadDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload}>
                    Upload Resource
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Resources Display */}
      {!loading && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const tags = parseTags(resource.tags);
            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {resource.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(resource)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Resource
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => openDeleteDialog(resource)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Resource
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    {resource.category && (
                      <Badge variant="secondary">{resource.category}</Badge>
                    )}
                    <span className="text-muted-foreground">
                      {resource.downloads || 0} downloads
                    </span>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {resource.created_at && (
                      <p>Uploaded {new Date(resource.created_at).toLocaleDateString()}</p>
                    )}
                    {resource.file_size && (
                      <p>Size: {formatFileSize(resource.file_size)}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="space-y-2">
          {resources.map((resource) => {
            const tags = parseTags(resource.tags);
            return (
              <Card key={resource.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-xl">{getTypeIcon(resource.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {resource.description || 'No description'}
                        </p>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="font-medium">{resource.downloads || 0} downloads</p>
                        {resource.created_at && (
                          <p className="text-muted-foreground">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownload(resource)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(resource)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => openDeleteDialog(resource)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Resource
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="text-center py-12">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">No resources found</p>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Upload your first resource to get started'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalResources)} of {totalResources} resources
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
              disabled={currentPage === lastPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input 
                id="edit-title" 
                placeholder="Enter resource title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Describe the resource"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input 
                id="edit-category"
                placeholder="Enter category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Update Resource
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedResource?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedResource(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
