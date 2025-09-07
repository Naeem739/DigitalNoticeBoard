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
  User,
  Building,
  Palette as PaletteIcon,
  Image,
  Download,
  CheckCircle,
  AlertCircle,
  Zap,
  Bookmark,
  Edit,
  Trash2,
  Plus,
  Grid,
  List,
  Search,
  Filter
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
    title: "Smart Notice Board",
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Public Notice Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Customize your public notice board appearance and content
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? "Hide Preview" : "Live Preview"}
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
              >
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex items-center gap-2 ${
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
                  {loading ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
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
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-800">
                  Settings Saved Successfully!
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Your public notice board has been updated and is now live.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6">
        {/* Removed the status summary tiles section */}

        {/* Live Preview Panel */}
        {previewMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  Live Preview
                  <Badge variant="secondary" className="ml-auto">
                    <Zap className="w-3 h-3 mr-1" />
                    Real-time
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full h-[60vh] rounded-lg overflow-hidden relative shadow-lg mx-auto max-w-4xl"
                  style={getBackgroundStyle()}
                >
                  {/* Header Preview */}
                  <div
                    className="p-6 border-b border-white/20"
                    style={{ backgroundColor: settings.headerBackgroundColor || "#1e293b", color: settings.fontColor || '#ffffff' }}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-4">
                        {settings.logo && (
                          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <img
                              src={settings.logo}
                              alt="Logo"
                              className="w-12 h-12 rounded-lg"
                            />
                          </div>
                        )}
                        <div>
                          <h1 className="text-3xl font-bold">{settings.title || "Smart Notice Board"}</h1>
                          <p className="text-lg opacity-90">{settings.subtitle || "Information Technology Department"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold font-mono">{getCurrentTime().time}</div>
                        <div className="text-sm opacity-90">{getCurrentTime().date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                      <div className="bg-white rounded-lg p-6 mb-6 shadow-lg border border-gray-100">
                        {/* Professional Header Section */}
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Affairs</h3>
                            <p className="text-sm text-gray-500 font-medium">Information Technology Department</p>
                          </div>
                        </div>

                        {/* Professional Content Section */}
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Academic Calendar 2025</h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    ২০২৫ শিক্ষাবর্ষের গ্রীষ্মকালীন সেমিস্টার - নতুন শিক্ষার্থীদের জন্য গুরুত্বপূর্ণ তথ্য
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                      Summer Semester
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Active
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-sm">
                                  <div className="text-center">
                                    <svg className="w-8 h-8 text-gray-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                                    </svg>
                                    <span className="text-xs font-bold text-gray-700">QR Code</span>
                                  </div>
                                </div>
                                <div className="text-xs mt-2 text-gray-500 font-medium">Scan to download</div>
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
                    style={{ backgroundColor: settings.footerBackgroundColor || "#1e293b", color: settings.fontColor || '#ffffff' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm">© 2024 Smart Notice Board. All rights reserved.</div>
                      <div className="font-medium">{settings.departmentName || "Information Technology Department"}</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Area - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Settings Panel - Left Side (2/3 width) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 space-y-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-lg">
                <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                  <Settings className="w-4 h-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="logo" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                  <Upload className="w-4 h-4" />
                  Logo
                </TabsTrigger>
                <TabsTrigger value="background" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                  <Palette className="w-4 h-4" />
                  Background
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
                  <ImageIcon className="w-4 h-4" />
                  Colors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      General Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">Page Title</Label>
                      <Input
                        id="title"
                        value={settings.title || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Smart Notice Board"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle" className="text-sm font-medium">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={settings.subtitle || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Information Technology Department"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departmentName" className="text-sm font-medium">Department Name</Label>
                      <Input
                        id="departmentName"
                        value={settings.departmentName || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, departmentName: e.target.value }))}
                        placeholder="Information Technology Department"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-red-600" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="emergencyNumber" className="text-sm font-medium">Emergency Number</Label>
                      <Input
                        id="emergencyNumber"
                        value={settings.emergencyNumber || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, emergencyNumber: e.target.value }))}
                        placeholder="01734528367"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact" className="text-sm font-medium">Contact Person</Label>
                      <Input
                        id="emergencyContact"
                        value={settings.emergencyContact || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Md. Rashid Al Asif"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logo" className="space-y-6 mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-green-600" />
                      Logo Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="logo" className="text-sm font-medium">Upload Logo</Label>
                      <div className="mt-1">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Recommended size: 200x200px, Max size: 5MB
                      </p>
                    </div>
                    {settings.logo && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Current Logo</Label>
                        <div className="mt-2 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                          <img
                            src={settings.logo}
                            alt="Logo"
                            className="max-w-[100px] max-h-[100px] object-contain mx-auto"
                          />
                          <p className="text-xs text-gray-600 mt-2 text-center">
                            {settings.logoFileName}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="background" className="space-y-6 mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-600" />
                      Background Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Background Type</Label>
                      <Select
                        value={settings.backgroundType}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, backgroundType: value as any }))}
                      >
                        <SelectTrigger className="mt-1">
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
                        <Label htmlFor="backgroundColor" className="text-sm font-medium">Background Color</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={settings.backgroundColor || "#1e293b"}
                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="h-12 w-20 rounded-lg border-2"
                          />
                          <Input
                            value={settings.backgroundColor || "#1e293b"}
                            onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="flex-1"
                            placeholder="#1e293b"
                          />
                        </div>
                      </div>
                    )}

                    {settings.backgroundType === "image" && (
                      <div>
                        <Label htmlFor="backgroundImage" className="text-sm font-medium">Upload Background Image</Label>
                        <div className="mt-1">
                          <Input
                            id="backgroundImage"
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundImageUpload}
                            className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Recommended size: 1920x1080px, Max size: 10MB
                        </p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Predefined Styles</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {backgroundStyles.map((style, index) => (
                          <div
                            key={index}
                            className="cursor-pointer border-2 border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                            onClick={() => handleBackgroundStyleSelect(style)}
                          >
                            <div
                              className="h-16 rounded-lg mb-2 shadow-inner"
                              style={{ background: style.preview }}
                            />
                            <p className="text-xs text-center font-medium">{style.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors" className="space-y-6 mt-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PaletteIcon className="w-5 h-5 text-orange-600" />
                      Color Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="headerBackgroundColor" className="text-sm font-medium">Header Background Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="headerBackgroundColor"
                          type="color"
                          value={settings.headerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                          className="h-12 w-20 rounded-lg border-2"
                        />
                        <Input
                          value={settings.headerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#1e293b"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="footerBackgroundColor" className="text-sm font-medium">Footer Background Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="footerBackgroundColor"
                          type="color"
                          value={settings.footerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, footerBackgroundColor: e.target.value }))}
                          className="h-12 w-20 rounded-lg border-2"
                        />
                        <Input
                          value={settings.footerBackgroundColor || "#1e293b"}
                          onChange={(e) => setSettings(prev => ({ ...prev, footerBackgroundColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#1e293b"
                        />
                      </div>
                    </div>
                    {/* Accent color option removed as requested */}
                    <div>
                      <Label htmlFor="fontColor" className="text-sm font-medium">Font Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="fontColor"
                          type="color"
                          value={settings.fontColor || "#ffffff"}
                          onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))}
                          className="h-12 w-20 rounded-lg border-2"
                        />
                        <Input
                          value={settings.fontColor || "#ffffff"}
                          onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))}
                          className="flex-1"
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
            className="space-y-6 xl:col-span-1"
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