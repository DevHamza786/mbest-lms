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
  ExternalLink,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Resource {
  id: string;
  resourceId?: number;
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
  file_path?: string;
  tags: string[];
  rating: number;
  _apiResource?: any;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
    // Toggle preview if already shown
    if (showPreview) {
      setShowPreview(false);
      setPreviewUrl(null);
      return;
    }

    setIsLoading(true);
    
    try {
      if (resource.type === 'link') {
        // For links, open directly in a new tab
        if (resource.url && resource.url !== '#') {
          window.open(resource.url, '_blank', 'noopener,noreferrer');
          setIsLoading(false);
          return;
        }
      }

      // Get the file URL
      let fileUrl = resource.url;
      
      // If we have a file_path, construct the full URL
      if (resource.file_path && !fileUrl.startsWith('http')) {
        const baseURL = apiClient.getBaseURL().replace('/api/v1', '');
        fileUrl = resource.file_path.startsWith('/') 
          ? `${baseURL}${resource.file_path}` 
          : `${baseURL}/storage/${resource.file_path}`;
      }

      // For PDFs and documents, open in new tab (browser will handle preview)
      if (resource.type === 'pdf' || resource.type === 'document') {
        if (fileUrl && fileUrl !== '#') {
          // Try to open in a new tab for browser preview
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          setPreviewUrl(fileUrl);
          setShowPreview(true);
        } else {
          // Fallback: try to get from API
          const resourceId = resource.resourceId || resource._apiResource?.id || resource.id;
          if (resourceId) {
            const baseURL = apiClient.getBaseURL().replace('/api/v1', '');
            const apiUrl = `${baseURL}/api/v1/resources/${resourceId}/download`;
            window.open(apiUrl, '_blank', 'noopener,noreferrer');
            setPreviewUrl(apiUrl);
            setShowPreview(true);
          }
        }
      } else if (resource.type === 'video') {
        // For videos, try to embed or open
        if (fileUrl && fileUrl !== '#') {
          setPreviewUrl(fileUrl);
          setShowPreview(true);
        } else {
          const resourceId = resource.resourceId || resource._apiResource?.id || resource.id;
          if (resourceId) {
            const baseURL = apiClient.getBaseURL().replace('/api/v1', '');
            const apiUrl = `${baseURL}/api/v1/resources/${resourceId}/download`;
            setPreviewUrl(apiUrl);
            setShowPreview(true);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Preview failed:', error);
      setIsLoading(false);
      // Fallback: try to open URL in new tab
      if (resource.url && resource.url !== '#') {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    }
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

  // Reset preview when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowPreview(false);
      setPreviewUrl(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <div className="border rounded-lg bg-muted/20">
              {showPreview && previewUrl ? (
                <div className="p-4">
                  {resource.type === 'pdf' || resource.type === 'document' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[500px] border-0 rounded"
                      title={`Preview of ${resource.title}`}
                      onError={() => {
                        setShowPreview(false);
                        window.open(previewUrl, '_blank', 'noopener,noreferrer');
                      }}
                    />
                  ) : resource.type === 'video' ? (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full rounded"
                      onError={() => {
                        setShowPreview(false);
                        window.open(previewUrl, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              ) : (
                <div className="p-8 text-center">
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
                        <p className="text-sm text-muted-foreground break-all">
                          {resource.url && resource.url !== '#' ? resource.url : 'No URL available'}
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {resource.type === 'link' ? (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  ) : showPreview ? (
                    <Eye className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {resource.type === 'link' ? 'Open Link' : showPreview ? 'Hide Preview' : 'Show Preview'}
                </>
              )}
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
