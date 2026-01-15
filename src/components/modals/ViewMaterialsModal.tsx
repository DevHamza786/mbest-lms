import { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink, Folder, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { commonApi } from '@/lib/api';

interface ViewMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number | null;
  className: string;
}

export function ViewMaterialsModal({ isOpen, onClose, classId, className }: ViewMaterialsModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen && classId) {
      loadMaterials();
    } else {
      setMaterials([]);
    }
  }, [isOpen, classId]);

  const loadMaterials = async () => {
    if (!classId) return;
    
    try {
      setIsLoading(true);
      const resources = await commonApi.resources.list({ class_id: classId, per_page: 100 });
      setMaterials(resources);
    } catch (error) {
      console.error('Failed to load materials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course materials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
      case 'document': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'link': return <ExternalLink className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
      case 'document': return 'bg-red-100 text-red-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'link': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = async (material: any) => {
    try {
      if (material.type?.toLowerCase() === 'link' && material.url) {
        window.open(material.url, '_blank', 'noopener,noreferrer');
        return;
      }

      if (material.id) {
        const blob = await commonApi.resources.download(material.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.file_name || material.title || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Downloading",
          description: `${material.title} download started...`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download resource",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (material: any) => {
    if (material.type?.toLowerCase() === 'link' && material.url) {
      window.open(material.url, '_blank', 'noopener,noreferrer');
    } else if (material.file_path) {
      // Open file in new tab for preview
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const fileUrl = `${baseURL}/storage/${material.file_path}`;
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Preview",
        description: `Opening ${material.title}...`,
      });
    }
  };

  const filteredMaterials = activeTab === 'all' 
    ? materials 
    : materials.filter(m => m.type?.toLowerCase() === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Course Materials - {className}
          </DialogTitle>
          <DialogDescription>
            Access and download course materials and resources
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Materials</TabsTrigger>
            <TabsTrigger value="pdf">PDFs</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
          </TabsList>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No materials available for this class.</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-3">
                  {filteredMaterials.map((material) => (
                    <Card key={material.id} className="transition-shadow hover:shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(material.type)}
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {material.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {material.description || 'No description'}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getTypeColor(material.type)}>
                            {material.type?.toUpperCase() || 'DOCUMENT'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {material.file_size && <span>{formatFileSize(material.file_size)}</span>}
                            <span>Uploaded: {new Date(material.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePreview(material)}>
                              <Eye className="mr-1 h-3 w-3" />
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => handleDownload(material)}>
                              <Download className="mr-1 h-3 w-3" />
                              {material.type?.toLowerCase() === 'link' ? 'Open' : 'Download'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="pdf" className="space-y-3">
                  {filteredMaterials.filter(m => m.type?.toLowerCase() === 'pdf' || m.type?.toLowerCase() === 'document').map((material) => (
                    <Card key={material.id} className="transition-shadow hover:shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(material.type)}
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {material.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {formatFileSize(material.file_size)} • {new Date(material.created_at).toLocaleDateString()}
                              </CardDescription>     
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePreview(material)}>
                            <Eye className="mr-1 h-3 w-3" />
                            Preview
                          </Button>
                          <Button size="sm" onClick={() => handleDownload(material)}>
                            <Download className="mr-1 h-3 w-3" />
                            Download PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="video" className="space-y-3">
                  {filteredMaterials.filter(m => m.type?.toLowerCase() === 'video').map((material) => (
                    <Card key={material.id} className="transition-shadow hover:shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          {getTypeIcon(material.type)}
                          {material.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {material.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button size="sm" onClick={() => handlePreview(material)}>
                          <Eye className="mr-1 h-3 w-3" />
                          Watch Video
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="link" className="space-y-3">
                  {filteredMaterials.filter(m => m.type?.toLowerCase() === 'link').map((material) => (
                    <Card key={material.id} className="transition-shadow hover:shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          {getTypeIcon(material.type)}
                          {material.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {material.description || material.url || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button size="sm" onClick={() => handleDownload(material)}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Open Link
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}