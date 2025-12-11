import { useState } from 'react';
import { FileText, Download, Eye, ExternalLink, Folder } from 'lucide-react';
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

interface Material {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'link';
  size?: string;
  uploadDate: string;
  url: string;
}

interface ViewMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
}

const mockMaterials: Material[] = [
  {
    id: '1',
    title: 'Lecture Notes - Week 1',
    description: 'Introduction to calculus concepts and basic derivatives',
    type: 'pdf',
    size: '2.3 MB',
    uploadDate: '2024-01-15',
    url: '#'
  },
  {
    id: '2',
    title: 'Practice Problems Set 1',
    description: 'Derivative practice problems with solutions',
    type: 'pdf',
    size: '1.8 MB',
    uploadDate: '2024-01-16',
    url: '#'
  },
  {
    id: '3',
    title: 'Video Lecture: Chain Rule',
    description: 'Detailed explanation of the chain rule with examples',
    type: 'video',
    uploadDate: '2024-01-17',
    url: 'https://youtube.com/watch?v=example'
  },
  {
    id: '4',
    title: 'Online Calculator Tool',
    description: 'Graphing calculator for derivative visualization',
    type: 'link',
    uploadDate: '2024-01-18',
    url: 'https://calculator.example.com'
  }
];

export function ViewMaterialsModal({ isOpen, onClose, className }: ViewMaterialsModalProps) {
  const { toast } = useToast();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'link': return <ExternalLink className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'link': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (material: Material) => {
    toast({
      title: "Downloading",
      description: `${material.title} download started...`,
    });
    
    if (material.type === 'link') {
      window.open(material.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePreview = (material: Material) => {
    toast({
      title: "Opening Preview",
      description: `Opening ${material.title} in preview mode...`,
    });
  };

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
        
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Materials</TabsTrigger>
            <TabsTrigger value="pdf">PDFs</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
          </TabsList>

          <div className="max-h-[400px]">
            <TabsContent value="all" className="space-y-3">
              {mockMaterials.map((material) => (
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
                            {material.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getTypeColor(material.type)}>
                        {material.type.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {material.size && <span>{material.size}</span>}
                        <span>Uploaded: {new Date(material.uploadDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePreview(material)}>
                          <Eye className="mr-1 h-3 w-3" />
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => handleDownload(material)}>
                          <Download className="mr-1 h-3 w-3" />
                          {material.type === 'link' ? 'Open' : 'Download'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pdf" className="space-y-3">
              {mockMaterials.filter(m => m.type === 'pdf').map((material) => (
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
                            {material.size} • {new Date(material.uploadDate).toLocaleDateString()}
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
              {mockMaterials.filter(m => m.type === 'video').map((material) => (
                <Card key={material.id} className="transition-shadow hover:shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getTypeIcon(material.type)}
                      {material.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {material.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button size="sm" onClick={() => handleDownload(material)}>
                      <Eye className="mr-1 h-3 w-3" />
                      Watch Video
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="link" className="space-y-3">
              {mockMaterials.filter(m => m.type === 'link').map((material) => (
                <Card key={material.id} className="transition-shadow hover:shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getTypeIcon(material.type)}
                      {material.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {material.description}
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}