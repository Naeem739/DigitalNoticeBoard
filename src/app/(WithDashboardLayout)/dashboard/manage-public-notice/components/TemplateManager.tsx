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
  Download,
  Trash2,
  Bookmark,
  Save
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
  const [searchTerm, setSearchTerm] = useState("")
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

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

  const handleQuickSaveTemplate = async () => {
    const name = typeof window !== 'undefined' ? window.prompt('Template name') : ''
    if (!name || !name.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' })
      return
    }

    const normalized = name.trim().toLowerCase()
    const exists = templates.some(t => t.name.trim().toLowerCase() === normalized)
    if (exists) {
      if (typeof window !== 'undefined') {
        window.alert('A template with this name already exists. Please choose another name.')
      }
      toast({ title: 'Duplicate name', description: 'Please choose another name.', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ...currentSettings })
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: 'Template Saved', description: 'Template has been saved successfully!' })
        await loadTemplates()
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save template', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' })
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
    return template.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, templates])

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize))
  const pageStartIndex = (currentPage - 1) * pageSize
  const displayedTemplates = filteredTemplates.slice(pageStartIndex, pageStartIndex + pageSize)

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
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span>Templates</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {templates.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1" />
            <Button onClick={handleQuickSaveTemplate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save as Template
            </Button>
          </div>
          <div className="relative">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium">No templates found</p>
              </div>
            ) : (
              <AnimatePresence>
                {displayedTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`group border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-all ${
                      appliedTemplateId === template.id ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-md shadow-inner border border-gray-100" style={getBackgroundPreview(template)} />
                        <div className="truncate">
                          <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApplyTemplate(template)} disabled={loading} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                          <Download className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(template.id, template.name)} disabled={loading} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {filteredTemplates.length > 0 && (
            <div className="flex items-center justify-between pt-3">
              <div className="text-xs text-gray-600">
                Showing {filteredTemplates.length === 0 ? 0 : pageStartIndex + 1}-{Math.min(pageStartIndex + pageSize, filteredTemplates.length)} of {filteredTemplates.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2"
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2"
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-700 px-1">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2"
                >
                  »
                </Button>
              </div>
            </div>
          )}
            
        </CardContent>
      </Card>
    </>
  )
} 