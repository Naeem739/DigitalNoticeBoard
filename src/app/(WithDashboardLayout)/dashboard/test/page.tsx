"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PublicNoticeTemplate, PublicNoticeSettings } from "@/types/types"
import { 
  Eye, 
  Clock,
  CheckCircle,
  Globe,
  Phone,
  User,
  Building,
  Palette,
  Monitor,
  Settings
} from "lucide-react"
import { motion } from "framer-motion"

interface AppliedTemplatePreviewProps {
  currentSettings: Partial<PublicNoticeSettings>
  availableTemplates: PublicNoticeTemplate[]
}

function AppliedTemplatePreview({ currentSettings, availableTemplates }: AppliedTemplatePreviewProps) {
  const getBackgroundStyle = (settings: Partial<PublicNoticeSettings>) => {
    if (settings.backgroundType === "image" && settings.backgroundImage) {
      return { 
        backgroundImage: `url(${settings.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    } else if (settings.backgroundType === "solid" && settings.backgroundColor) {
      return { backgroundColor: settings.backgroundColor }
    } else if (settings.backgroundType === "gradient" && settings.gradientColors) {
      return {
        background: `linear-gradient(135deg, ${settings.gradientColors.join(", ")})`
      }
    }
    return { backgroundColor: "#1e293b" }
  }

  const getCurrentTime = () => {
    const now = new Date()
    return {
      time: now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      date: now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
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

  // Find which template is currently applied
  const findAppliedTemplate = () => {
    if (!currentSettings || !availableTemplates.length) return null
    
    return availableTemplates.find(template => 
      template.title === currentSettings.title &&
      template.subtitle === currentSettings.subtitle &&
      template.backgroundType === currentSettings.backgroundType &&
      template.headerBackgroundColor === currentSettings.headerBackgroundColor &&
      template.footerBackgroundColor === currentSettings.footerBackgroundColor &&
      template.accentColor === currentSettings.accentColor
    )
  }

  const appliedTemplate = findAppliedTemplate()

  return (
    <div className="space-y-6">
      {/* Current Applied Template */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Currently Applied Template
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                {appliedTemplate ? appliedTemplate.name : "Custom Settings"}
              </Badge>
            </CardTitle>
            {appliedTemplate?.description && (
              <p className="text-sm text-gray-600 mt-2">{appliedTemplate.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {appliedTemplate ? formatDate(appliedTemplate.createdAt) : "Custom configuration"}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {currentSettings.title || "Smart Notice Board"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Preview */}
            <div
              className="w-full h-[500px] rounded-xl overflow-hidden relative shadow-2xl border-2 border-gray-200"
              style={getBackgroundStyle(currentSettings)}
            >
              {/* Header Preview */}
              <div
                className="p-6 border-b border-white/20"
                style={{ backgroundColor: currentSettings.headerBackgroundColor || "#1e293b" }}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    {currentSettings.logo && (
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <img
                          src={currentSettings.logo}
                          alt="Logo"
                          className="w-12 h-12 rounded-lg"
                        />
                      </div>
                    )}
                    <div>
                      <h1 className="text-3xl font-bold">{currentSettings.title || "Smart Notice Board"}</h1>
                      <p className="text-lg text-gray-300">{currentSettings.subtitle || "Information Technology Department"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold font-mono">{getCurrentTime().time}</div>
                    <div className="text-sm text-gray-300">{getCurrentTime().date}</div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">A</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Academic</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">i</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 text-lg">Bangladesh</div>
                              <div className="text-sm text-gray-600">২০২৫ শিক্ষাবর্ষের গ্রীষ্মকালীন সেমিস্টার...</div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-300">
                              <span className="text-xs font-bold text-gray-600">QR</span>
                            </div>
                            <div className="text-xs mt-1 text-gray-500">Scan to download</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Preview */}
              <div
                className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20"
                style={{ backgroundColor: currentSettings.footerBackgroundColor || "#1e293b" }}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="text-sm">© 2024 Smart Notice Board. All rights reserved.</div>
                  <div className="font-medium">{currentSettings.departmentName || "Information Technology Department"}</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Settings Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Title:</span>
                  <span className="text-gray-600">{currentSettings.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Department:</span>
                  <span className="text-gray-600">{currentSettings.departmentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Emergency:</span>
                  <span className="text-gray-600">{currentSettings.emergencyNumber}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Contact:</span>
                  <span className="text-gray-600">{currentSettings.emergencyContact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Background:</span>
                  <span className="text-gray-600 capitalize">{currentSettings.backgroundType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium">Accent:</span>
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: currentSettings.accentColor }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open('/notice', '_blank')}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Live
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/dashboard/manage-public-notice', '_blank')}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Edit Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function TestPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<PublicNoticeTemplate[]>([])
  const [currentSettings, setCurrentSettings] = useState<Partial<PublicNoticeSettings>>({})
  const [loading, setLoading] = useState(false)

  // Load templates and current settings on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load templates
      const templatesResponse = await fetch("/api/templates")
      const templatesResult = await templatesResponse.json()
      
      if (templatesResult.success) {
        setTemplates(templatesResult.data)
      } else {
        console.error("Failed to load templates:", templatesResult.error)
      }

      // Load current settings
      const settingsResponse = await fetch("/api/public-notice-settings")
      const settingsResult = await settingsResponse.json()
      
      if (settingsResult.success && settingsResult.data) {
        setCurrentSettings(settingsResult.data)
      } else {
        console.error("Failed to load settings:", settingsResult.error)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load templates and settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Applied Template Test
            </h1>
            <p className="text-gray-600 mt-1">
              View the currently applied template and its effects on your public notice board
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.open('/notice', '_blank')}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            View Public Page
          </Button>
        </div>
      </motion.div>

      {/* Applied Template Preview */}
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applied template and settings...</p>
          </div>
        </motion.div>
      ) : (
        <AppliedTemplatePreview
          currentSettings={currentSettings}
          availableTemplates={templates}
        />
      )}
    </div>
  )
} 