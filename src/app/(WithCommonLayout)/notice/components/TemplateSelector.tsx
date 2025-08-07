'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PublicNoticeTemplate } from '@/types/types';
import { Palette, CheckCircle } from 'lucide-react';

interface TemplateSelectorProps {
  onTemplateApply: (templateId: string) => Promise<boolean>;
  currentTemplateId?: string;
}

export default function TemplateSelector({ onTemplateApply, currentTemplateId }: TemplateSelectorProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PublicNoticeTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadTemplates();
  }, []);

  useEffect(() => {
    if (mounted && currentTemplateId) {
      setSelectedTemplate(currentTemplateId);
    } else if (mounted) {
      setSelectedTemplate('default');
    }
  }, [currentTemplateId, mounted]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      } else {
        console.error('Failed to load templates:', result.error);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    if (templateId === 'default') {
      // Clear active template
      setSelectedTemplate('default');
      toast({
        title: "Default Template Applied",
        description: "Default settings have been applied!",
      });
      return;
    }
    
    setLoading(true);
    try {
      const success = await onTemplateApply(templateId);
      
      if (success) {
        setSelectedTemplate(templateId);
        toast({
          title: "Template Applied",
          description: "Template has been applied successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to apply template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (templates.length === 0) {
    return null; // Don't show selector if no templates
  }

  return (
    <div 
      className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3"
      suppressHydrationWarning={true}
    >
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Template:</span>
        <Select
          value={selectedTemplate}
          onValueChange={handleTemplateChange}
          disabled={loading}
        >
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  {selectedTemplate === template.id && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
} 