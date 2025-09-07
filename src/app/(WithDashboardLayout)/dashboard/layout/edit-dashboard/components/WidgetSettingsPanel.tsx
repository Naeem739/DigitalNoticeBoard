"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Palette, Type, ListFilter, Box, Image as ImageIcon, GripVertical, X } from "lucide-react"

type SettingsTab = "style" | "typography" | "content" | "category" | "image"

type WidgetSettings = any
type ExtendedWidget = any

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "style", label: "Appearance", icon: <Palette size={16} /> },
  { id: "typography", label: "Typography", icon: <Type size={16} /> },
  { id: "content", label: "Content", icon: <Box size={16} /> },
  { id: "category", label: "Category", icon: <ListFilter size={16} /> },
  { id: "image", label: "Image", icon: <ImageIcon size={16} /> },
]

const getTabsForWidgetType = (widgetType?: "notice" | "image" | "pdf") => {
  if (widgetType === "image") return SETTINGS_TABS.filter(t => t.id !== "content")
  if (widgetType === "pdf") return SETTINGS_TABS.filter(t => t.id !== "content" && t.id !== "image")
  return SETTINGS_TABS.filter(t => t.id !== "image")
}

export default function WidgetSettingsPanel({
  activeSettingsWidget,
  onClose,
  widgets,
  widgetSettings,
  defaultWidgetSettings,
  activeSettingsTab,
  setActiveSettingsTab,
  updateWidgetSetting,
}: {
  activeSettingsWidget: string | null
  onClose: () => void
  widgets: ExtendedWidget[]
  widgetSettings: Record<string, WidgetSettings>
  defaultWidgetSettings: WidgetSettings
  activeSettingsTab: SettingsTab
  setActiveSettingsTab: (t: SettingsTab) => void
  updateWidgetSetting: (widgetId: string, setting: keyof WidgetSettings, value: any) => void
}) {
  const settingsRef = useRef<HTMLDivElement>(null)
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })

  const activeWidget = useMemo(() => widgets.find(w => w.id === activeSettingsWidget), [widgets, activeSettingsWidget])

  // Center/position when opened
  useEffect(() => {
    if (activeSettingsWidget && settingsRef.current) {
      const widgetElement = document.getElementById(activeSettingsWidget)
      if (widgetElement) {
        const rect = widgetElement.getBoundingClientRect()
        setSettingsPosition({ x: Math.min(rect.right, window.innerWidth - 300), y: Math.max(rect.top, 100) })
      } else {
        setSettingsPosition({ x: window.innerWidth / 2 - 150, y: 100 })
      }
    }
  }, [activeSettingsWidget])

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const newX = settingsPosition.x + (e.clientX - startPosition.x)
      const newY = settingsPosition.y + (e.clientY - startPosition.y)
      setSettingsPosition({ x: newX, y: newY })
      setStartPosition({ x: e.clientX, y: e.clientY })
    }
    const handleMouseUp = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, startPosition, settingsPosition])

  if (!activeSettingsWidget) return null

  const tabs = getTabsForWidgetType(activeWidget?.type)
  if (activeSettingsTab && !tabs.find(t => t.id === activeSettingsTab)) {
    setActiveSettingsTab(tabs[0].id)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 animate-in fade-in-0 duration-200 z-40" onClick={onClose} />
      <div
        ref={settingsRef}
        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-[500px] max-h-[85vh] flex flex-col animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        style={{ left: `${settingsPosition.x}px`, top: `${settingsPosition.y}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-gray-200 animate-in slide-in-from-top-2 duration-200" onMouseDown={handleDragStart}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><GripVertical size={18} className="text-blue-600" /></div>
            <h4 className="font-semibold text-gray-800 text-lg">Widget Settings</h4>
          </div>
          <button onClick={onClose} className="hover:bg-gray-200 rounded-full p-2 transition-colors duration-200"><X size={18} className="text-gray-500" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 animate-in slide-in-from-top-2 duration-300 delay-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${activeSettingsTab === tab.id ? "text-blue-700 border-b-2 border-blue-600 bg-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-800"}`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white animate-in fade-in-0 duration-500 delay-200">
          {activeSettingsTab === "style" && (
            <div className="space-y-8 animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4"><Palette size={18} className="text-blue-600" /> Background</label>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-3">Color</span>
                    <input type="color" value={widgetSettings[activeSettingsWidget]?.backgroundColor || defaultWidgetSettings.backgroundColor} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "backgroundColor", e.target.value)} className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-gray-600">Opacity</span><span className="text-xs font-semibold text-blue-600">{Math.round(((widgetSettings[activeSettingsWidget]?.backgroundOpacity || defaultWidgetSettings.backgroundOpacity) * 100))}%</span></div>
                    <input type="range" min="0.1" max="1" step="0.05" value={widgetSettings[activeSettingsWidget]?.backgroundOpacity || defaultWidgetSettings.backgroundOpacity} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "backgroundOpacity", Number.parseFloat(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4"><Box size={18} className="text-blue-600" /> Border</label>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-3">Color</span>
                    <input type="color" value={widgetSettings[activeSettingsWidget]?.borderColor || defaultWidgetSettings.borderColor} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "borderColor", e.target.value)} className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-gray-600">Width</span><span className="text-xs font-semibold text-blue-600">{widgetSettings[activeSettingsWidget]?.borderWidth || defaultWidgetSettings.borderWidth}px</span></div>
                    <input type="range" min="0" max="8" value={widgetSettings[activeSettingsWidget]?.borderWidth || defaultWidgetSettings.borderWidth} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "borderWidth", Number.parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4"><Box size={18} className="text-blue-600" /> Card Opacity</label>
                <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-gray-600">Transparency</span><span className="text-xs font-semibold text-blue-600">{Math.round(((widgetSettings[activeSettingsWidget]?.cardOpacity || defaultWidgetSettings.cardOpacity) * 100))}%</span></div>
                <input type="range" min="0.1" max="1" step="0.05" value={widgetSettings[activeSettingsWidget]?.cardOpacity || defaultWidgetSettings.cardOpacity} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "cardOpacity", Number.parseFloat(e.target.value))} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {activeSettingsTab === "typography" && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Type size={16} /> Text Color</label>
                <input type="color" value={widgetSettings[activeSettingsWidget]?.fontColor || defaultWidgetSettings.fontColor} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontColor", e.target.value)} className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Type size={16} /> Font Family</label>
                <select value={widgetSettings[activeSettingsWidget]?.fontFamily || defaultWidgetSettings.fontFamily} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontFamily", e.target.value)} className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="Inter">Inter (Modern)</option>
                  <option value="Arial">Arial (Classic)</option>
                  <option value="Helvetica">Helvetica (Clean)</option>
                  <option value="Times New Roman">Times New Roman (Traditional)</option>
                  <option value="Georgia">Georgia (Elegant)</option>
                  <option value="Verdana">Verdana (Readable)</option>
                  <option value="system-ui">System UI (Native)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Type size={16} /> Font Size</label>
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Size</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.fontSize || defaultWidgetSettings.fontSize}px</span></div>
                <input type="range" min="10" max="24" value={widgetSettings[activeSettingsWidget]?.fontSize || defaultWidgetSettings.fontSize} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontSize", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Type size={16} /> Font Weight</label>
                <select value={widgetSettings[activeSettingsWidget]?.fontWeight || defaultWidgetSettings.fontWeight} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "fontWeight", e.target.value)} className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="normal">Normal (400)</option>
                  <option value="medium">Medium (500)</option>
                  <option value="semibold">Semibold (600)</option>
                  <option value="bold">Bold (700)</option>
                </select>
              </div>
            </div>
          )}

          {activeSettingsTab === "content" && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><ListFilter size={16} /> Display Settings</label>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Number of Notices</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.noticeCount || defaultWidgetSettings.noticeCount}</span></div>
                    <input type="range" min="1" max={10} value={widgetSettings[activeSettingsWidget]?.noticeCount || defaultWidgetSettings.noticeCount} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "noticeCount", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Auto Scroll</span>
                      <button onClick={() => updateWidgetSetting(activeSettingsWidget, "autoScroll", !(widgetSettings[activeSettingsWidget]?.autoScroll || false))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${widgetSettings[activeSettingsWidget]?.autoScroll ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${widgetSettings[activeSettingsWidget]?.autoScroll ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Automatically scroll through notices when content overflows</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Show Full Content</span>
                      <button onClick={() => updateWidgetSetting(activeSettingsWidget, "showFullContent", !(widgetSettings[activeSettingsWidget]?.showFullContent || false))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${widgetSettings[activeSettingsWidget]?.showFullContent ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${widgetSettings[activeSettingsWidget]?.showFullContent ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Display complete notice content instead of truncated text</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === "category" && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><X size={16} style={{opacity:0}} /> Category Name</label>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Display Name</span>
                    <input type="text" value={widgetSettings[activeSettingsWidget]?.customCategoryName || ""} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "customCategoryName", e.target.value)} placeholder="Enter custom category name..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-400 mt-1">Leave empty to use the original category name</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><ListFilter size={16} /> Category Styling</label>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Background Color</span>
                    <input type="color" value={widgetSettings[activeSettingsWidget]?.categoryBackgroundColor || defaultWidgetSettings.categoryBackgroundColor} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryBackgroundColor", e.target.value)} className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Height</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.categoryHeight || defaultWidgetSettings.categoryHeight}px</span></div>
                    <input type="range" min="24" max="60" value={widgetSettings[activeSettingsWidget]?.categoryHeight || defaultWidgetSettings.categoryHeight} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryHeight", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Type size={16} /> Category Typography</label>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Text Color</span>
                    <input type="color" value={widgetSettings[activeSettingsWidget]?.categoryFontColor || defaultWidgetSettings.categoryFontColor} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFontColor", e.target.value)} className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Font Family</span>
                    <select value={widgetSettings[activeSettingsWidget]?.categoryFont || defaultWidgetSettings.categoryFont} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFont", e.target.value)} className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                      <option value="Inter">Inter (Modern)</option>
                      <option value="Arial">Arial (Classic)</option>
                      <option value="Helvetica">Helvetica (Clean)</option>
                      <option value="Times New Roman">Times New Roman (Traditional)</option>
                      <option value="Georgia">Georgia (Elegant)</option>
                      <option value="Verdana">Verdana (Readable)</option>
                      <option value="system-ui">System UI (Native)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Font Size</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.categoryFontSize || defaultWidgetSettings.categoryFontSize}px</span></div>
                    <input type="range" min="10" max="20" value={widgetSettings[activeSettingsWidget]?.categoryFontSize || defaultWidgetSettings.categoryFontSize} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFontSize", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Font Weight</span>
                    <select value={widgetSettings[activeSettingsWidget]?.categoryFontWeight || defaultWidgetSettings.categoryFontWeight} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryFontWeight", e.target.value)} className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                      <option value="normal">Normal (400)</option>
                      <option value="medium">Medium (500)</option>
                      <option value="semibold">Semibold (600)</option>
                      <option value="bold">Bold (700)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Box size={16} /> Category Border</label>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Border Color</span>
                    <input type="color" value={widgetSettings[activeSettingsWidget]?.categoryBorderColor || defaultWidgetSettings.categoryBorderColor} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryBorderColor", e.target.value)} className="w-6 h-6 p-0 rounded-full ml-1 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Border Width</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.categoryBorderWidth || defaultWidgetSettings.categoryBorderWidth}px</span></div>
                    <input type="range" min="0" max="5" value={widgetSettings[activeSettingsWidget]?.categoryBorderWidth || defaultWidgetSettings.categoryBorderWidth} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "categoryBorderWidth", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === "image" && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-2 duration-300">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><ImageIcon size={16} /> Display Settings</label>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Image Fit</span>
                    <select value={widgetSettings[activeSettingsWidget]?.imageFit || defaultWidgetSettings.imageFit} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageFit", e.target.value)} className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                      <option value="cover">Cover (Fill)</option>
                      <option value="contain">Contain (Fit)</option>
                      <option value="fill">Fill (Stretch)</option>
                      <option value="none">None (Original)</option>
                      <option value="scale-down">Scale Down</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Border Radius</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.imageBorderRadius || defaultWidgetSettings.imageBorderRadius}px</span></div>
                    <input type="range" min="0" max="50" value={widgetSettings[activeSettingsWidget]?.imageBorderRadius || defaultWidgetSettings.imageBorderRadius} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageBorderRadius", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Show Image Title</span>
                      <button onClick={() => updateWidgetSetting(activeSettingsWidget, "showImageTitle", !(widgetSettings[activeSettingsWidget]?.showImageTitle || false))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${widgetSettings[activeSettingsWidget]?.showImageTitle ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${widgetSettings[activeSettingsWidget]?.showImageTitle ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Palette size={16} /> Image Effects</label>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Brightness</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.imageBrightness || defaultWidgetSettings.imageBrightness}%</span></div>
                    <input type="range" min="0" max="200" value={widgetSettings[activeSettingsWidget]?.imageBrightness || defaultWidgetSettings.imageBrightness} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageBrightness", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Contrast</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.imageContrast || defaultWidgetSettings.imageContrast}%</span></div>
                    <input type="range" min="0" max="200" value={widgetSettings[activeSettingsWidget]?.imageContrast || defaultWidgetSettings.imageContrast} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageContrast", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Saturation</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.imageSaturation || defaultWidgetSettings.imageSaturation}%</span></div>
                    <input type="range" min="0" max="200" value={widgetSettings[activeSettingsWidget]?.imageSaturation || defaultWidgetSettings.imageSaturation} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageSaturation", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Blur</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.imageBlur || defaultWidgetSettings.imageBlur}px</span></div>
                    <input type="range" min="0" max="20" value={widgetSettings[activeSettingsWidget]?.imageBlur || defaultWidgetSettings.imageBlur} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageBlur", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Rotation</span><span className="text-xs text-gray-600">{widgetSettings[activeSettingsWidget]?.imageRotation || defaultWidgetSettings.imageRotation}°</span></div>
                    <input type="range" min="0" max="360" value={widgetSettings[activeSettingsWidget]?.imageRotation || defaultWidgetSettings.imageRotation} onChange={(e) => updateWidgetSetting(activeSettingsWidget, "imageRotation", Number.parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><ListFilter size={16} /> Image Filters</label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Grayscale</span>
                      <button onClick={() => updateWidgetSetting(activeSettingsWidget, "imageGrayscale", !(widgetSettings[activeSettingsWidget]?.imageGrayscale || false))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${widgetSettings[activeSettingsWidget]?.imageGrayscale ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${widgetSettings[activeSettingsWidget]?.imageGrayscale ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Sepia</span>
                      <button onClick={() => updateWidgetSetting(activeSettingsWidget, "imageSepia", !(widgetSettings[activeSettingsWidget]?.imageSepia || false))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${widgetSettings[activeSettingsWidget]?.imageSepia ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${widgetSettings[activeSettingsWidget]?.imageSepia ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Invert Colors</span>
                      <button onClick={() => updateWidgetSetting(activeSettingsWidget, "imageInvert", !(widgetSettings[activeSettingsWidget]?.imageInvert || false))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${widgetSettings[activeSettingsWidget]?.imageInvert ? "bg-blue-600" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${widgetSettings[activeSettingsWidget]?.imageInvert ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


