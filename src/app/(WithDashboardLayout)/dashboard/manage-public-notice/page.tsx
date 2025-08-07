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
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
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
    accentColor: "#3b82f6"
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
      console.log("Loading settings...")
      const response = await fetch("/api/public-notice-settings")
      const result = await response.json()
      console.log("Load response:", result)
      
      if (result.success && result.data) {
        setSettings(result.data)
        console.log("Settings loaded successfully")
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
      console.log("Saving settings:", JSON.stringify(settings, null, 2))
      
      const response = await fetch("/api/public-notice-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()
      console.log("Save response:", result)

      if (result.success) {
        setSaveSuccess(true)
        toast({
          title: "✅ Settings Saved Successfully!",
          description: "Your public notice board settings have been updated and are now live.",
        })
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      } else {
        toast({
          title: "❌ Save Failed",
          description: result.error || "Failed to update settings. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "❌ Save Failed",
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

  const handleTestDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Database Test Successful",
          description: result.message,
        })
      } else {
        toast({
          title: "Database Test Failed",
          description: result.error || "Database connection failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Database Test Failed",
        description: "Failed to test database connection",
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
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl shadow-lg bg-white/80 backdrop-blur-md px-8 py-6 border border-gray-100"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-md">
            <Globe className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
              Public Notice Settings
            </h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">
              Customize the appearance and content of your public notice board
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? "Hide Preview" : "Live Preview"}
          </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <Button
            variant="outline"
            onClick={() => window.open('/notice', '_blank')}
              className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          >
            <Globe className="w-4 h-4" />
            View Public Page
          </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <Button
            variant="outline"
            onClick={handleTestDatabase}
            disabled={loading}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              {loading ? (
                <motion.div 
                  className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
            <CheckCircle className="w-4 h-4" />
              )}
              {loading ? "Testing..." : "Test Database"}
          </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <Button
            variant="outline"
            onClick={handleInitializeSettings}
            disabled={loading}
              className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
            >
              {loading ? (
                <motion.div 
                  className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
            <RotateCcw className="w-4 h-4" />
              )}
              {loading ? "Initializing..." : "Initialize Settings"}
          </Button>
          </motion.div>
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
              className={`flex items-center gap-2 transition-all duration-300 ${
                saveSuccess 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25" 
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }`}
          >
            {loading ? (
                <motion.div 
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : saveSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle className="w-4 h-4" />
                </motion.div>
            ) : (
              <Save className="w-4 h-4" />
            )}
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: loading ? 0.8 : 1 }}
              >
                {loading ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
              </motion.span>
          </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Section Divider */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 rounded-full my-2 opacity-70" />

      {/* Success Banner */}
      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-gradient-to-r from-green-100 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 bg-green-100 rounded-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
            </motion.div>
            <div className="flex-1">
              <motion.div 
                className="text-sm font-medium text-green-800"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Settings Saved Successfully! 🎉
              </motion.div>
              <motion.div 
                className="text-xs text-green-600 mt-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your public notice board has been updated and is now live. Changes will be visible immediately.
              </motion.div>
            </div>
            <motion.button
              onClick={() => setSaveSuccess(false)}
              className="p-1 hover:bg-green-200 rounded-full transition-colors"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Info Alert */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-blue-800">Auto-Refresh Enabled</div>
            <div className="text-xs text-blue-600">
              The public notice page automatically refreshes every 30 seconds to show your latest changes.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-green-800">Settings Status</div>
                <div className="text-xs text-green-600">All configured</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-800">Preview Mode</div>
                <div className="text-xs text-blue-600">{previewMode ? "Active" : "Inactive"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PaletteIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-purple-800">Background</div>
                <div className="text-xs text-purple-600 capitalize">{settings.backgroundType}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-orange-800">Last Updated</div>
                <div className="text-xs text-orange-600">Just now</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Divider */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 rounded-full my-2 opacity-70" />

      {/* Main Content Area - Two Column Layout */}
      <div className="space-y-8">
        {/* Live Preview Panel - Top */}
        {previewMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="border-2 border-gray-100 shadow-2xl rounded-3xl bg-white/90 backdrop-blur-xl">
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
                  className="w-full h-[500px] rounded-xl overflow-hidden relative shadow-2xl mx-auto max-w-4xl"
                  style={getBackgroundStyle()}
                >
                  {/* Header Preview */}
                  <div
                    className="p-6 border-b border-white/20"
                    style={{ backgroundColor: settings.headerBackgroundColor || "#1e293b" }}
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
                          <p className="text-lg text-gray-300">{settings.subtitle || "Information Technology Department"}</p>
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
                      <div className="bg-white rounded-xl p-8 mb-6 shadow-xl border border-gray-100">
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
                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
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
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
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
                    style={{ backgroundColor: settings.footerBackgroundColor || "#1e293b" }}
                  >
                    <div className="flex items-center justify-between text-white">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Settings Panel - Left Side (2/3 width) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 space-y-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-100 via-purple-100 to-emerald-100 rounded-xl shadow-inner">
                <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-full px-4 py-2 font-semibold">
                <Settings className="w-4 h-4" />
                General
              </TabsTrigger>
                <TabsTrigger value="logo" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-full px-4 py-2 font-semibold">
                <Upload className="w-4 h-4" />
                Logo
              </TabsTrigger>
                <TabsTrigger value="background" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-full px-4 py-2 font-semibold">
                <Palette className="w-4 h-4" />
                Background
              </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-full px-4 py-2 font-semibold">
                <ImageIcon className="w-4 h-4" />
                Colors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-6">
              <Card className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
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

              <Card className="border-2 border-gray-100 hover:border-red-200 transition-colors">
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

            <TabsContent value="logo" className="space-y-4 mt-6">
              <Card className="border-2 border-gray-100 hover:border-green-200 transition-colors">
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

            <TabsContent value="background" className="space-y-4 mt-6">
              <Card className="border-2 border-gray-100 hover:border-purple-200 transition-colors">
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

            <TabsContent value="colors" className="space-y-4 mt-6">
              <Card className="border-2 border-gray-100 hover:border-orange-200 transition-colors">
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
                  <div>
                    <Label htmlFor="accentColor" className="text-sm font-medium">Accent Color</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={settings.accentColor || "#3b82f6"}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="h-12 w-20 rounded-lg border-2"
                      />
                      <Input
                        value={settings.accentColor || "#3b82f6"}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1"
                        placeholder="#3b82f6"
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
            className="space-y-8 xl:sticky xl:top-32"
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