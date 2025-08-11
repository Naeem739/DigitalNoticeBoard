'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PublicNoticeTemplate, PublicNoticeSettings } from "@/types/types"
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  Clock,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Grid,
  List,
  Edit,
  Copy,
  Star,
  MoreHorizontal,
  ExternalLink,
  Settings as SettingsIcon
} from "lucide-react"
import { motion } from "framer-motion"

interface TemplateManagerProps {
  currentSettings: Partial<PublicNoticeSettings>
  onSettingsChange: (settings: Partial<PublicNoticeSettings>) => void
}

export default function TemplateManager({ currentSettings, onSettingsChange }: TemplateManagerProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<PublicNoticeTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showViewAllDialog, setShowViewAllDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedTemplate, setSelectedTemplate] = useState<PublicNoticeTemplate | null>(null)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/templates")
      const result = await response.json()
      
      if (result.success) {
        setTemplates(result.data)
      } else {
        console.error("Failed to load templates:", result.error)
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          ...currentSettings
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Template Saved",
          description: "Template has been saved successfully!",
        })
        setShowSaveDialog(false)
        setTemplateName("")
        setTemplateDescription("")
        await loadTemplates() // Reload templates
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save template",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async (template: PublicNoticeTemplate) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: 'apply' }),
      })

      const result = await response.json()

      if (result.success) {
        // Update current settings with template data
        onSettingsChange({
          logo: template.logo,
          logoFileName: template.logoFileName,
          title: template.title,
          subtitle: template.subtitle,
          emergencyNumber: template.emergencyNumber,
          emergencyContact: template.emergencyContact,
          departmentName: template.departmentName,
          backgroundType: template.backgroundType,
          backgroundColor: template.backgroundColor,
          gradientColors: template.gradientColors,
          backgroundImage: template.backgroundImage,
          backgroundImageFileName: template.backgroundImageFileName,
          headerBackgroundColor: template.headerBackgroundColor,
          footerBackgroundColor: template.footerBackgroundColor,
          accentColor: template.accentColor,
        })

        toast({
          title: "Template Applied",
          description: `${template.name} has been applied successfully!`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to apply template",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTemplate = async (template: PublicNoticeTemplate) => {
    setSelectedTemplate(template)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setShowSaveDialog(true)
  }

  const handleDuplicateTemplate = async (template: PublicNoticeTemplate) => {
    try {
      setLoading(true)
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          logo: template.logo,
          logoFileName: template.logoFileName,
          title: template.title,
          subtitle: template.subtitle,
          emergencyNumber: template.emergencyNumber,
          emergencyContact: template.emergencyContact,
          departmentName: template.departmentName,
          backgroundType: template.backgroundType,
          backgroundColor: template.backgroundColor,
          gradientColors: template.gradientColors,
          backgroundImage: template.backgroundImage,
          backgroundImageFileName: template.backgroundImageFileName,
          headerBackgroundColor: template.headerBackgroundColor,
          footerBackgroundColor: template.footerBackgroundColor,
          accentColor: template.accentColor,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Template Duplicated",
          description: "Template has been duplicated successfully!",
        })
        await loadTemplates() // Reload templates
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to duplicate template",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Template Deleted",
          description: "Template has been deleted successfully!",
        })
        await loadTemplates() // Reload templates
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete template",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }



  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter and search templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "gradient" && template.backgroundType === "gradient") ||
                         (filterType === "solid" && template.backgroundType === "solid") ||
                         (filterType === "image" && template.backgroundType === "image")
    
    return matchesSearch && matchesFilter
  })

  const getBackgroundPreview = (template: PublicNoticeTemplate) => {
    if (template.backgroundType === "image" && template.backgroundImage) {
      return { backgroundImage: `url(${template.backgroundImage})` }
    } else if (template.backgroundType === "solid" && template.backgroundColor) {
      return { backgroundColor: template.backgroundColor }
    } else if (template.backgroundType === "gradient" && template.gradientColors) {
      return { background: `linear-gradient(135deg, ${template.gradientColors.join(", ")})` }
    }
    return { backgroundColor: "#1e293b" }
  }

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600" />
            Template Manager
            <Badge variant="secondary" className="ml-auto">
              {templates.length} templates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Save className="w-4 h-4" />
                  Save as Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Save Current Settings as Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Enter template name"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={loading || !templateName.trim()}
                      className="flex-1"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {loading ? "Saving..." : "Save Template"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              onClick={() => setShowViewAllDialog(true)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View All
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Templates List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recent Templates</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No templates found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchTerm || filterType !== "all" ? "Try adjusting your search or filter" : "Save your current settings as a template to get started"}
                </p>
              </div>
            ) : (
              <div className={`space-y-2 max-h-64 overflow-y-auto ${
                viewMode === "grid" ? "grid grid-cols-2 gap-2" : ""
              }`}>
                {filteredTemplates.slice(0, viewMode === "grid" ? 4 : 3).map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all ${
                      viewMode === "grid" ? "text-center" : ""
                    }`}
                  >
                    {viewMode === "grid" ? (
                      <div className="space-y-2">
                        <div
                          className="h-16 rounded-lg mb-2 shadow-inner"
                          style={getBackgroundPreview(template)}
                        />
                        <h4 className="font-medium text-gray-900 text-sm truncate">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {template.backgroundType}
                        </Badge>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyTemplate(template)}
                            disabled={loading}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.backgroundType}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(template.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyTemplate(template)}
                            disabled={loading}
                            className="flex items-center gap-1"
                            title="Apply Template"
                          >
                            <Download className="w-3 h-3" />
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                            disabled={loading}
                            className="flex items-center gap-1"
                            title="Edit Template"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateTemplate(template)}
                            disabled={loading}
                            className="flex items-center gap-1"
                            title="Duplicate Template"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                            disabled={loading}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowViewAllDialog(true)}
              className="flex items-center gap-2 text-xs"
            >
              <SettingsIcon className="w-3 h-3" />
              Manage All
            </Button>
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-800">Template Tips</div>
                <div className="text-xs text-gray-600 mt-1">
                  Save your current settings as templates to quickly apply them later. 
                  Use search and filters to find the perfect template.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View All Templates Dialog */}
      <Dialog open={showViewAllDialog} onOpenChange={setShowViewAllDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              All Templates ({templates.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search and Filter for Dialog */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search all templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div
                      className="h-24 rounded-lg mb-3 shadow-inner"
                      style={getBackgroundPreview(template)}
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {template.backgroundType}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(template.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyTemplate(template)}
                          disabled={loading}
                          className="flex items-center gap-1 text-xs flex-1"
                        >
                          <Download className="w-3 h-3" />
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                          disabled={loading}
                          className="flex items-center gap-1"
                          title="Edit Template"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicateTemplate(template)}
                          disabled={loading}
                          className="flex items-center gap-1"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          disabled={loading}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No templates found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm || filterType !== "all" ? "Try adjusting your search or filter criteria" : "Create your first template to get started"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 