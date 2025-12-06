/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PublicNoticeSettings, BackgroundStyle } from "@/types/types"
import { 
  Upload, 
  Save, 
  Eye, 
  Palette, 
  Image as ImageIcon, 
  Settings, 
  Monitor,
  Globe,
  Phone,
  Building,
  Palette as PaletteIcon,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react"
import { motion } from "framer-motion"
import TemplateManager from "./components/TemplateManager"

// Predefined background styles
const backgroundStyles: BackgroundStyle[] = [
  {
    name: "Professional Dark",
    type: "gradient",
    colors: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)"
  },
  {
    name: "Deep Blue",
    type: "gradient",
    colors: ["#0c4a6e", "#075985", "#0369a1", "#0284c7", "#0ea5e9"],
    preview: "linear-gradient(135deg, #0c4a6e 0%, #075985 25%, #0369a1 50%, #0284c7 75%, #0ea5e9 100%)"
  },
  {
    name: "Corporate Gray",
    type: "gradient",
    colors: ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af"],
    preview: "linear-gradient(135deg, #1f2937 0%, #374151 25%, #4b5563 50%, #6b7280 75%, #9ca3af 100%)"
  },
  {
    name: "Dark Purple",
    type: "gradient",
    colors: ["#1e1b4b", "#312e81", "#4338ca", "#6366f1", "#8b5cf6"],
    preview: "linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4338ca 50%, #6366f1 75%, #8b5cf6 100%)"
  },
  {
    name: "Solid Dark",
    type: "solid",
    colors: ["#1e293b"],
    preview: "#1e293b"
  },
  {
    name: "Solid Blue",
    type: "solid",
    colors: ["#1e40af"],
    preview: "#1e40af"
  }
]

export default function ManagePublicNoticePage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Partial<PublicNoticeSettings>>({
    title: "Digital Notice Board",
    subtitle: "Information Technology Department",
    emergencyNumber: "01734528367",
    emergencyContact: "Md. Rashid Al Asif",
    departmentName: "Information Technology Department",
    backgroundType: "gradient",
    gradientColors: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b"],
    headerBackgroundColor: "#1e293b",
    footerBackgroundColor: "#1e293b",
    accentColor: "#3b82f6",
    fontColor: "#ffffff"
  })
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Load existing settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/public-notice-settings")
      const result = await response.json()
      
      if (result.success && result.data) {
        setSettings(result.data)
      } else {
        console.error("Failed to load settings:", result.error)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch("/api/public-notice-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (result.success) {
        setSaveSuccess(true)
        toast({
          title: "Settings Saved Successfully!",
          description: "Your public notice board settings have been updated and are now live.",
        })
        // Notify other tabs/pages to refresh immediately
        try {
          if (typeof window !== 'undefined') {
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('public-notice')
              bc.postMessage({ type: 'settings-updated', at: Date.now() })
              bc.close()
            }
            // localStorage fallback to trigger storage event
            localStorage.setItem('public-notice-settings-updated', String(Date.now()))
          }
        } catch {}
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to update settings. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInitializeSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/init-settings", {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Settings Initialized",
          description: "Default settings have been created successfully!",
        })
        // Reload settings after initialization
        await loadSettings()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to initialize settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo file size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSettings(prev => ({
          ...prev,
          logo: result,
          logoFileName: file.name
        }))
        toast({
          title: "Logo Uploaded",
          description: "Logo has been uploaded successfully!",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo",
        variant: "destructive",
      })
    }
  }

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Background image file size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSettings(prev => ({
          ...prev,
          backgroundImage: result,
          backgroundImageFileName: file.name,
          backgroundType: "image"
        }))
        toast({
          title: "Background Uploaded",
          description: "Background image has been uploaded successfully!",
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload background image",
        variant: "destructive",
      })
    }
  }

  const handleBackgroundStyleSelect = (style: BackgroundStyle) => {
    setSettings(prev => ({
      ...prev,
      backgroundType: style.type,
      backgroundColor: style.type === "solid" ? style.colors[0] : undefined,
      gradientColors: style.type === "gradient" ? style.colors : undefined,
      backgroundImage: undefined,
      backgroundImageFileName: undefined
    }))
    toast({
      title: "Style Applied",
      description: `${style.name} background style has been applied!`,
    })
  }

  const getBackgroundStyle = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg flex-shrink-0">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Public Notice Settings
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
                  Customize your public notice board appearance and content
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{previewMode ? "Hide Preview" : "Live Preview"}</span>
                <span className="sm:hidden">{previewMode ? "Hide" : "Preview"}</span>
              </Button>
              <motion.div
                initial={{ scale: 1 }}
                animate={{ 
                  scale: saveSuccess ? [1, 1.05, 1] : 1,
                  backgroundColor: saveSuccess ? "#10b981" : undefined
                }}
                transition={{ 
                  duration: 0.3,
                  scale: { duration: 0.2, repeat: saveSuccess ? 2 : 0 }
                }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto ${
                    saveSuccess 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{loading ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}</span>
                  <span className="sm:hidden">{loading ? "Saving..." : saveSuccess ? "Saved!" : "Save"}</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 border-b border-green-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-green-800">
                  Settings Saved Successfully!
                </div>
                <div className="text-xs text-green-600 mt-0.5 sm:mt-1 hidden sm:block">
                  Your public notice board has been updated and is now live.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        {/* Removed the status summary tiles section */}

        {/* Live Preview Panel */}
        {previewMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Live Preview
                  <Badge variant="secondary" className="ml-auto text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Real-time</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div
                  className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] rounded-lg overflow-hidden relative shadow-lg mx-auto max-w-4xl"
                  style={getBackgroundStyle()}
                >
                  {/* Header Preview */}
                  <div
                    className="p-3 sm:p-4 md:p-6 border-b border-white/20"
                    style={{ backgroundColor: settings.headerBackgroundColor || "#1e293b", color: settings.fontColor || '#ffffff' }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                        {settings.logo && (
                          <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <img
                              src={settings.logo}
                              alt="Logo"
                              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">{settings.title || "Digital Notice Board"}</h1>
                          <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 truncate">{settings.subtitle || "Information Technology Department"}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-mono">{getCurrentTime().time}</div>
                        <div className="text-xs sm:text-sm opacity-90 whitespace-nowrap">{getCurrentTime().date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/20">
                      <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 shadow-lg border border-gray-100">
                        {/* Professional Header Section */}
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight truncate">Academic Affairs</h3>
                            <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">Information Technology Department</p>
                          </div>
                        </div>

                        {/* Professional Content Section */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 md:p-6 border border-blue-100 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full border border-white"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1">Academic Calendar 2025</h4>
                                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                                    ২০২৫ শিক্ষাবর্ষের গ্রীষ্মকালীন সেমিস্টার - নতুন শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ তথ্য
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                      Summer Semester
                                    </span>
                                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Active
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center flex-shrink-0 self-center sm:self-auto">
                                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-sm mx-auto">
                                  <div className="text-center">
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                                    </svg>
                                    <span className="text-xs font-bold text-gray-700">QR Code</span>
                                  </div>
                                </div>
                                <div className="text-xs mt-1 sm:mt-2 text-gray-500 font-medium">Scan to download</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Preview */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 border-t border-white/20"
                    style={{ backgroundColor: settings.footerBackgroundColor || "#1e293b", color: settings.fontColor || '#ffffff' }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
                      <div className="truncate">© 2024 Digital Notice Board. All rights reserved.</div>
                      <div className="font-medium truncate hidden sm:block">{settings.departmentName || "Information Technology Department"}</div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-medium">Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Area - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
          {/* Settings Panel - Left Side (2/3 width) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 space-y-4 sm:space-y-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1 gap-1">
                <TabsTrigger value="general" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="logo" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logo</span>
                </TabsTrigger>
                <TabsTrigger value="background" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm">
                  <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Background</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm">
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Colors</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      General Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div>
                      <Label htmlFor="title" className="text-xs sm:text-sm font-medium">Page Title</Label>
                      <Input
                        id="title"
                        value={settings.title || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Digital Notice Board"
                        className="mt-1 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle" className="text-xs sm:text-sm font-medium">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={settings.subtitle || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Information Technology Department"
                        className="mt-1 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departmentName" className="text-xs sm:text-sm font-medium">Department Name</Label>
                      <Input
                        id="departmentName"
                        value={settings.departmentName || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, departmentName: e.target.value }))}
                        placeholder="Information Technology Department"
                        className="mt-1 text-sm sm:text-base"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div className="relative">
                      <Label htmlFor="emergencyNumber" className="text-xs sm:text-sm font-medium">Emergency Number</Label>
                      <Input
                        id="emergencyNumber"
                        value={settings.emergencyNumber || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, emergencyNumber: e.target.value }))}
                        placeholder="01734528367"
                        className="mt-1 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact" className="text-xs sm:text-sm font-medium">Contact Person</Label>
                      <Input
                        id="emergencyContact"
                        value={settings.emergencyContact || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Md. Rashid Al Asif"
                        className="mt-1 text-sm sm:text-base"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logo" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      Logo Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div>
                      <Label htmlFor="logo" className="text-xs sm:text-sm font-medium">Upload Logo</Label>
                      <div className="mt-1">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="cursor-pointer file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-xs sm:text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Recommended size: 200x200px, Max size: 5MB
                      </p>
                    </div>
                    {settings.logo && (
                      <div className="mt-4">
                        <Label className="text-xs sm:text-sm font-medium">Current Logo</Label>
                        <div className="mt-2 p-3 sm:p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                          <img
                            src={settings.logo}
                            alt="Logo"
                            className="max-w-[80px] sm:max-w-[100px] max-h-[80px] sm:max-h-[100px] object-contain mx-auto"
                          />
                          <p className="text-xs text-gray-600 mt-2 text-center truncate">
                            {settings.logoFileName}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="background" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      Background Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Background Type</Label>
                      <Select
                        value={settings.backgroundType}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, backgroundType: value as any }))}
                      >
                        <SelectTrigger className="mt-1 text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gradient">Gradient</SelectItem>
                          <SelectItem value="solid">Solid Color</SelectItem>
                          <SelectItem value="image">Custom Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.backgroundType === "solid" && (
                      <div>
                        <Label htmlFor="backgroundColor" className="text-xs sm:text-sm font-medium">Background Color</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={settings.backgroundColor || "#1e293b"}
                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="h-10 sm:h-12 w-16 sm:w-20 rounded-lg border-2 flex-shrink-0"
                          />
                          <Input
                            value={settings.backgroundColor || "#1e293b"}
                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="flex-1 text-sm sm:text-base"
                            placeholder="#1e293b"
                          />
                        </div>
                      </div>
                    )}

                    {settings.backgroundType === "image" && (
                      <div>
                        <Label htmlFor="backgroundImage" className="text-xs sm:text-sm font-medium">Upload Background Image</Label>
                        <div className="mt-1">
                          <Input
                            id="backgroundImage"
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundImageUpload}
                            className="cursor-pointer file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 text-xs sm:text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Recommended size: 1920x1080px, Max size: 10MB
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Predefined Styles</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mt-2">
                        {backgroundStyles.map((style, index) => (
                          <div
                            key={index}
                            className="cursor-pointer border-2 border-gray-200 rounded-lg p-2 sm:p-3 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                            onClick={() => handleBackgroundStyleSelect(style)}
                          >
                            <div
                              className="h-12 sm:h-14 md:h-16 rounded-lg mb-1 sm:mb-2 shadow-inner"
                              style={{ background: style.preview }}
                            />
                            <p className="text-xs text-center font-medium truncate">{style.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <PaletteIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      Color Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div>
                      <Label htmlFor="headerBackgroundColor" className="text-xs sm:text-sm font-medium">Header Background Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="headerBackgroundColor"
                          type="color"
                          value={settings.headerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                          className="h-10 sm:h-12 w-16 sm:w-20 rounded-lg border-2 flex-shrink-0"
                        />
                        <Input
                          value={settings.headerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                          className="flex-1 text-sm sm:text-base"
                          placeholder="#1e293b"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="footerBackgroundColor" className="text-xs sm:text-sm font-medium">Footer Background Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="footerBackgroundColor"
                          type="color"
                          value={settings.footerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, footerBackgroundColor: e.target.value }))}
                          className="h-10 sm:h-12 w-16 sm:w-20 rounded-lg border-2 flex-shrink-0"
                        />
                        <Input
                          value={settings.footerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, footerBackgroundColor: e.target.value }))}
                          className="flex-1 text-sm sm:text-base"
                          placeholder="#1e293b"
                        />
                      </div>
                    </div>
                    {/* Accent color option removed as requested */}
                    <div>
                      <Label htmlFor="fontColor" className="text-xs sm:text-sm font-medium">Font Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="fontColor"
                          type="color"
                          value={settings.fontColor || "#ffffff"}
                          onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))}
                          className="h-10 sm:h-12 w-16 sm:w-20 rounded-lg border-2 flex-shrink-0"
                        />
                        <Input
                          value={settings.fontColor || "#ffffff"}
                          onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))}
                          className="flex-1 text-sm sm:text-base"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Templates Panel - Right Side (1/3 width) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 sm:space-y-6 xl:col-span-1"
          >
            <TemplateManager 
              currentSettings={settings}
              onSettingsChange={setSettings}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
} 