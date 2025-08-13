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
  Settings as SettingsIcon,
  Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null)

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

        // Show success message and highlight applied template
        setAppliedTemplateId(template.id)
        toast({
          title: "Template Applied Successfully! ✨",
          description: `${template.name} has been applied to your notice board.`,
        })

        // Reset highlight after 3 seconds
        setTimeout(() => setAppliedTemplateId(null), 3000)

        // Broadcast that settings changed so public page refreshes immediately
        try {
          if (typeof window !== 'undefined') {
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('public-notice')
              bc.postMessage({ type: 'settings-updated', at: Date.now() })
              bc.close()
            }
            localStorage.setItem('public-notice-settings-updated', String(Date.now()))
          }
        } catch {}
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
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Template Manager</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  {templates.length} templates
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-normal mt-1">Save and apply design templates</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Save className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Save Current Settings as Template
                  </DialogTitle>
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
                  <div>
                    <Label htmlFor="templateDescription">Description (Optional)</Label>
                    <Textarea
                      id="templateDescription"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe your template..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={loading || !templateName.trim()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
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
              className="flex items-center gap-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4" />
              View All
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 ml-auto bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-2"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-2"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Templates List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Recent Templates</Label>
              <span className="text-xs text-gray-500">{filteredTemplates.length} found</span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium">No templates found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchTerm || filterType !== "all" ? "Try adjusting your search or filter" : "Save your current settings as a template to get started"}
                </p>
              </div>
            ) : (
              <div className={`space-y-3 max-h-80 overflow-y-auto ${
                viewMode === "grid" ? "grid grid-cols-2 gap-3" : ""
              }`}>
                <AnimatePresence>
                  {filteredTemplates.slice(0, viewMode === "grid" ? 4 : 3).map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`group relative border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
                        appliedTemplateId === template.id ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50' : 'bg-white'
                      } ${
                        viewMode === "grid" ? "text-center" : ""
                      }`}
                    >
                      {appliedTemplateId === template.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.div>
                      )}
                      
                      {viewMode === "grid" ? (
                        <div className="space-y-3">
                          <div
                            className="h-20 rounded-lg mb-3 shadow-inner border border-gray-100"
                            style={getBackgroundPreview(template)}
                          />
                          <h4 className="font-medium text-gray-900 text-sm truncate">{template.name}</h4>
                          <Badge variant="outline" className="text-xs bg-gray-50">
                            {template.backgroundType}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyTemplate(template)}
                            disabled={loading}
                            className="w-full mt-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg shadow-inner border border-gray-100"
                                style={getBackgroundPreview(template)}
                              />
                              <div>
                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs bg-gray-50">
                                    {template.backgroundType}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {formatDate(template.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplyTemplate(template)}
                              disabled={loading}
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              title="Apply Template"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTemplate(template)}
                              disabled={loading}
                              size="sm"
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                              title="Edit Template"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDuplicateTemplate(template)}
                              disabled={loading}
                              size="sm"
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                              title="Duplicate Template"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTemplate(template.id, template.name)}
                              disabled={loading}
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Template"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowViewAllDialog(true)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800"
            >
              <SettingsIcon className="w-3 h-3" />
              Manage All Templates
            </Button>
          </div>

          {/* Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-blue-800 mb-1">Pro Tips</div>
                <div className="text-xs text-blue-700 leading-relaxed">
                  Save your current settings as templates to quickly apply them later. 
                  Use search and filters to find the perfect design for your notice board.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View All Templates Dialog */}
      <Dialog open={showViewAllDialog} onOpenChange={setShowViewAllDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <div>All Templates</div>
                <div className="text-sm font-normal text-gray-500 mt-1">
                  {templates.length} templates available
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Search and Filter for Dialog */}
            <div className="flex items-center gap-3">
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
                <Card key={template.id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardContent className="p-4">
                    <div
                      className="h-28 rounded-lg mb-4 shadow-inner border border-gray-100"
                      style={getBackgroundPreview(template)}
                    />
                    <div className="space-y-3">
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
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyTemplate(template)}
                          disabled={loading}
                          className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          title="Edit Template"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateTemplate(template)}
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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