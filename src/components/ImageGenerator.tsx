import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    imageUrl: string;
    filename: string;
    prompt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      console.log('Calling generate-image function with:', { prompt, model, width, height });
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: prompt.trim(),
          model: model,
          width: width,
          height: height
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to call image generation function');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success && data.imageUrl) {
        setGeneratedImage({
          imageUrl: data.imageUrl,
          filename: data.filename,
          prompt: data.prompt
        });

        toast({
          title: "Success!",
          description: "Image generated and saved successfully!",
        });

        // Call the callback if provided
        if (onImageGenerated) {
          onImageGenerated(data.imageUrl);
        }
      } else {
        throw new Error('Invalid response from image generation function');
      }

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyImageUrl = async () => {
    if (generatedImage?.imageUrl) {
      try {
        await navigator.clipboard.writeText(generatedImage.imageUrl);
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Image URL copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy URL to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setPrompt('');
    setGeneratedImage(null);
    setCopied(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ImageIcon className="h-4 w-4" />
          Generate Image with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Image with AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generation Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Description *</Label>
              <Input
                id="prompt"
                placeholder="e.g., their companies have grown exponentially"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="flux">Flux</option>
                  <option value="turbo">Turbo</option>
                  <option value="anything-v5">Anything V5</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  min="512"
                  max="2048"
                  step="64"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  min="512"
                  max="2048"
                  step="64"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
                  disabled={isGenerating}
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating and saving image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generate & Save Image
                </>
              )}
            </Button>
          </div>

          {/* Generated Image Result */}
          {generatedImage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <img 
                    src={generatedImage.imageUrl} 
                    alt={generatedImage.prompt}
                    className="max-w-full max-h-64 object-contain rounded-lg shadow-md mx-auto"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <strong>Prompt:</strong> {generatedImage.prompt}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Filename:</strong> {generatedImage.filename}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedImage.imageUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyImageUrl}
                      className="gap-1"
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};