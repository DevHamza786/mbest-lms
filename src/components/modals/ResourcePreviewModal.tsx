import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Video, 
  Link, 
  Download, 
  Star, 
  Calendar,
  User,
  Eye,
  ExternalLink
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  class: string;
  uploadedBy: string;
  uploadDate: string;
  downloads: number;
  fileSize?: string;
  url: string;
  tags: string[];
  rating: number;
}

interface ResourcePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onDownload?: (resource: Resource) => void;
  onFavorite?: (resource: Resource) => void;
  isFavorite?: boolean;
}

export function ResourcePreviewModal({ 
  open, 
  onOpenChange, 
  resource,
  onDownload,
  onFavorite,
  isFavorite = false
}: ResourcePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!resource) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'video': return <Video className="h-5 w-5 text-blue-500" />;
      case 'link': return <Link className="h-5 w-5 text-green-500" />;
      case 'document': return <FileText className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'video': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'link': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'document': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({length: 5}, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const handlePreview = async () => {
    setIsLoading(true);
    
    // Simulate loading time for preview
    setTimeout(() => {
      if (resource.type === 'link') {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      } else {
        // For other types, we would typically show an embedded viewer
        // For now, we'll just show a message
        console.log(`Opening preview for ${resource.title}`);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(resource);
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(resource);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getTypeIcon(resource.type)}
            <span className="flex-1">{resource.title}</span>
            <Badge className={getTypeColor(resource.type)}>
              {resource.type.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {resource.class} • Uploaded by {resource.uploadedBy}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resource Info */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resource.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Uploaded: {new Date(resource.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>By: {resource.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>{resource.downloads} downloads</span>
              </div>
              {resource.fileSize && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Size: {resource.fileSize}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rating:</span>
              <div className="flex items-center gap-1">
                {renderStars(resource.rating)}
                <span className="text-sm text-muted-foreground ml-1">({resource.rating})</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <h4 className="font-semibold mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Preview Area */}
          <div className="space-y-4">
            <h4 className="font-semibold">Preview</h4>
            <div className="border rounded-lg p-8 bg-muted/20 text-center">
              {resource.type === 'video' && (
                <div className="space-y-4">
                  <Video className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Video Preview</p>
                    <p className="text-sm text-muted-foreground">
                      Click the preview button to watch this video
                    </p>
                  </div>
                </div>
              )}
              
              {resource.type === 'pdf' && (
                <div className="space-y-4">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">PDF Document</p>
                    <p className="text-sm text-muted-foreground">
                      Click the preview button to view this document
                    </p>
                  </div>
                </div>
              )}

              {resource.type === 'link' && (
                <div className="space-y-4">
                  <Link className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">External Link</p>
                    <p className="text-sm text-muted-foreground">
                      This will open in a new tab: {resource.url}
                    </p>
                  </div>
                </div>
              )}

              {resource.type === 'document' && (
                <div className="space-y-4">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Document</p>
                    <p className="text-sm text-muted-foreground">
                      Click the preview button to view this document
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handlePreview} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <>
                  {resource.type === 'link' ? (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                </>
              )}
              {resource.type === 'link' ? 'Open Link' : 'Preview'}
            </Button>
            
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              {resource.type === 'link' ? 'Copy Link' : 'Download'}
            </Button>
            
            <Button variant="outline" onClick={handleFavorite}>
              <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {isFavorite ? 'Remove' : 'Favorite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
