import { useState } from 'react';
import { Plus, Search, Filter, Upload, Download, Eye, MoreHorizontal, FileText, Image, Link, Video } from 'lucide-react';
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
import classesData from '@/data/classes.json';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'link' | 'pdf' | 'video' | 'image';
  category: string;
  tags: string[];
  url: string;
  fileSize: string | null;
  classId: string | null;
  className: string | null;
  createdAt: string;
  downloads: number;
  public: boolean;
}

export default function TutorResources() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document' as 'document' | 'link' | 'pdf' | 'video' | 'image',
    category: '',
    tags: '',
    url: '',
    classId: '',
    public: false,
  });

  const myClasses = classesData.filter(cls => cls.tutorId === 'tutor-1');

  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      title: 'React Hooks Cheat Sheet',
      description: 'Comprehensive guide to React hooks with examples',
      type: 'pdf',
      category: 'Reference',
      tags: ['react', 'hooks', 'javascript'],
      url: '/resources/react-hooks.pdf',
      fileSize: '2.3 MB',
      classId: 'class-1',
      className: 'Advanced Web Development',
      createdAt: '2024-01-15',
      downloads: 45,
      public: true
    },
    {
      id: '2',
      title: 'Data Structures Visualization',
      description: 'Interactive visualization of common data structures',
      type: 'link',
      category: 'Interactive',
      tags: ['data-structures', 'algorithms', 'visualization'],
      url: 'https://visualgo.net/en/list',
      fileSize: null,
      classId: 'class-2',
      className: 'Data Structures & Algorithms',
      createdAt: '2024-01-12',
      downloads: 32,
      public: true
    },
    {
      id: '3',
      title: 'TypeScript Advanced Patterns',
      description: 'Video tutorial on advanced TypeScript patterns',
      type: 'video',
      category: 'Tutorial',
      tags: ['typescript', 'patterns', 'advanced'],
      url: 'https://youtube.com/watch?v=example',
      fileSize: null,
      classId: 'class-1',
      className: 'Advanced Web Development',
      createdAt: '2024-01-10',
      downloads: 28,
      public: false
    },
    {
      id: '4',
      title: 'Algorithm Complexity Chart',
      description: 'Visual reference for Big O notation',
      type: 'image',
      category: 'Reference',
      tags: ['algorithms', 'complexity', 'big-o'],
      url: '/resources/big-o-chart.png',
      fileSize: '856 KB',
      classId: 'class-2',
      className: 'Data Structures & Algorithms',
      createdAt: '2024-01-08',
      downloads: 67,
      public: true
    }
  ]);

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return FileText;
      case 'video':
        return Video;
      case 'image':
        return Image;
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
      case 'image':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'link':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleUploadResource = () => {
    if (!newResource.title || !newResource.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedClass = myClasses.find(cls => cls.id === newResource.classId);
    
    const resource: Resource = {
      id: Date.now().toString(),
      title: newResource.title,
      description: newResource.description,
      type: newResource.type,
      category: newResource.category || 'General',
      tags: newResource.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      url: newResource.url || `/resources/${newResource.title.toLowerCase().replace(/\s+/g, '-')}`,
      fileSize: newResource.type === 'link' ? null : '1.2 MB', // Mock file size
      classId: newResource.classId || null,
      className: selectedClass?.name || null,
      createdAt: new Date().toISOString().split('T')[0],
      downloads: 0,
      public: newResource.public
    };

    setResources(prev => [...prev, resource]);
    setNewResource({
      title: '',
      description: '',
      type: 'document',
      category: '',
      tags: '',
      url: '',
      classId: '',
      public: false,
    });
    setIsUploadOpen(false);

    toast({
      title: "Resource Added",
      description: "Your resource has been uploaded successfully.",
    });
  };

  const handleDownload = (resource: Resource) => {
    setResources(prev => prev.map(r => 
      r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r
    ));
    
    toast({
      title: "Download Started",
      description: `Downloading ${resource.title}`,
    });
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesClass = selectedClass === 'all' || resource.classId === selectedClass;

    return matchesSearch && matchesType && matchesClass;
  });

  const stats = {
    total: resources.length,
    public: resources.filter(r => r.public).length,
    private: resources.filter(r => !r.public).length,
    totalDownloads: resources.reduce((acc, r) => acc + r.downloads, 0)
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
                <Select value={newResource.type} onValueChange={(value: 'document' | 'link' | 'pdf' | 'video' | 'image') => setNewResource(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
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
                  <Select value={newResource.classId} onValueChange={(value) => setNewResource(prev => ({ ...prev, classId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific class</SelectItem>
                      {myClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
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
                  <Label>File Upload</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Choose File
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newResource.public}
                  onChange={(e) => setNewResource(prev => ({ ...prev, public: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="public" className="text-sm">
                  Make this resource publicly accessible to all students
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadResource}>Add Resource</Button>
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
                <SelectItem value="image">Images</SelectItem>
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
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resources Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const IconComponent = getTypeIcon(resource.type);
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
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold mb-2">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {resource.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Category: {resource.category}</span>
                        {resource.fileSize && <span>{resource.fileSize}</span>}
                      </div>
                      
                      {resource.className && (
                        <div className="text-xs text-muted-foreground">
                          Class: {resource.className}
                        </div>
                      )}

                      {resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {resource.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {resource.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {resource.downloads} downloads
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
        </TabsContent>

        <TabsContent value="my-uploads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Uploaded</CardTitle>
              <CardDescription>Resources you've added recently</CardDescription>
            </CardHeader>
            <CardContent>
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
                            {resource.createdAt} • {resource.downloads} downloads
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}