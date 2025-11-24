/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { X } from "lucide-react"

import type { Layout } from "react-grid-layout"

type DashboardTemplate = any
type ExtendedWidget = any
type WidgetSettings = any

export default function TemplatesPanel({
  userRole,
  templates,
  widgets,
  layout,
  isLoadingTemplates,
  searchTerm,
  setSearchTerm,
  isApplyingTemplate,
  isDeletingTemplate,
  isUpdatingTemplate,
  isSavingTemplate,
  onViewAll,
  onView,
  onEdit,
  onDelete,
  onApply,
  // Save modal
  showTemplateModal,
  setShowTemplateModal,
  templateName,
  setTemplateName,
  templateDescription,
  setTemplateDescription,
  onSaveTemplate,
  // Duplicate name modal
  showDuplicateNameDialog,
  setShowDuplicateNameDialog,
  pendingTemplate,
  onReplaceTemplate,
  onTryAnotherName,
  // View all modal
  showViewAllModal,
  setShowViewAllModal,
  // Edit modal
  showEditModal,
  setShowEditModal,
  editingTemplate,
  onUpdateTemplate,
  // View modal
  showViewModal,
  setShowViewModal,
  selectedTemplate,
  // helpers
  hexToRgba,
  defaultWidgetSettings,
}: {
  userRole: string | undefined
  templates: DashboardTemplate[]
  widgets: ExtendedWidget[]
  layout: Layout[]
  isLoadingTemplates: boolean
  searchTerm: string
  setSearchTerm: (v: string) => void
  isApplyingTemplate: boolean
  isDeletingTemplate: boolean
  isUpdatingTemplate: boolean
  isSavingTemplate: boolean
  onViewAll: () => void
  onView: (t: DashboardTemplate) => void
  onEdit: (t: DashboardTemplate) => void
  onDelete: (id: string) => void
  onApply: (t: DashboardTemplate) => void
  showTemplateModal: boolean
  setShowTemplateModal: (v: boolean) => void
  templateName: string
  setTemplateName: (v: string) => void
  templateDescription: string
  setTemplateDescription: (v: string) => void
  onSaveTemplate: () => void
  showDuplicateNameDialog: boolean
  setShowDuplicateNameDialog: (v: boolean) => void
  pendingTemplate: DashboardTemplate | null
  onReplaceTemplate: () => void
  onTryAnotherName: () => void
  showViewAllModal: boolean
  setShowViewAllModal: (v: boolean) => void
  showEditModal: boolean
  setShowEditModal: (v: boolean) => void
  editingTemplate: DashboardTemplate | null
  onUpdateTemplate: () => void
  showViewModal: boolean
  setShowViewModal: (v: boolean) => void
  selectedTemplate: DashboardTemplate | null
  hexToRgba: (hex: string, opacity: number) => string
  defaultWidgetSettings: WidgetSettings
}) {
  return (
    <>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-6 border border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-800">Templates</h3>
          <div className="flex items-center gap-2">
            <button onClick={onViewAll} className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors">View All</button>
            {userRole !== 'MODERATOR' && (
              <button onClick={() => setShowTemplateModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors">Save Current</button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/80 backdrop-blur-sm shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            {widgets.length === 0 ? (
              <span className="text-amber-600">Add widgets to see available templates</span>
            ) : (
              <>
                <span>{templates.filter(t => t.widgets.length === widgets.length).length} templates available for {widgets.length} widget{widgets.length !== 1 ? 's' : ''}</span>
                {templates.length > templates.filter(t => t.widgets.length === widgets.length).length && (
                  <span className="text-gray-400">{templates.length - templates.filter(t => t.widgets.length === widgets.length).length} other template{templates.length - templates.filter(t => t.widgets.length === widgets.length).length !== 1 ? 's' : ''} available</span>
                )}
              </>
            )}
          </div>
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : templates.filter(t => t.widgets.length === widgets.length).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-sm">No templates available for {widgets.length} widget{widgets.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-400 mt-1">Create a template with {widgets.length} widget{widgets.length !== 1 ? 's' : ''}, or adjust your current widgets</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {templates
                .filter(template => template.widgets.length === widgets.length && (
                  template.name.toLowerCase().includes(searchTerm.toLowerCase()) || (template.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                ))
                .map((template: DashboardTemplate) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                        {template.description && <p className="text-xs text-gray-600 mt-1">{template.description}</p>}
                        <div className="text-xs text-gray-500 mt-1">{template.widgets.length} widgets</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onView(template)} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200" title="View Template">View</button>
                        <button onClick={() => onApply(template)} disabled={isApplyingTemplate} className={`text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md ${isApplyingTemplate ? 'opacity-75 cursor-not-allowed' : ''}`} title="Apply Template">{isApplyingTemplate ? 'Applying...' : 'Apply'}</button>
                        {userRole !== 'MODERATOR' && (
                          <>
                            <button onClick={() => onEdit(template)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200" title="Edit Template">Edit</button>
                            <button onClick={() => onDelete(template.id)} disabled={isDeletingTemplate} className={`text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 ${isDeletingTemplate ? 'opacity-50 cursor-not-allowed' : ''}`} title="Delete Template">{isDeletingTemplate ? '...' : 'Delete'}</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
                <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Enter template name..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Describe your template..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Template Preview</p>
                      <p className="text-blue-600 mt-1">{widgets.length} widgets • {layout.length} layout items</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowTemplateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onSaveTemplate} disabled={isSavingTemplate} className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isSavingTemplate ? 'opacity-75 cursor-not-allowed' : ''}`}>{isSavingTemplate ? 'Saving...' : 'Save Template'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDuplicateNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Template Name Already Exists</h3>
                <button onClick={() => { setShowDuplicateNameDialog(false) }} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Template &ldquo;{pendingTemplate?.name || templateName}&ldquo; already exists</p>
                      <p className="text-yellow-600 mt-1">Choose an option to proceed:</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <button onClick={onReplaceTemplate} className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Replace Existing Template</button>
                  <button onClick={onTryAnotherName} className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Try Another Name</button>
                  <button onClick={() => setShowDuplicateNameDialog(false)} className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">All Templates</h3>
                <button onClick={() => setShowViewAllModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h4>
                  <p className="text-gray-500">Create your first template to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template: DashboardTemplate) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center gap-1">
                          <button onClick={() => onView(template)} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">View</button>
                          {userRole !== 'MODERATOR' && (
                            <>
                              <button onClick={() => onEdit(template)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">Edit</button>
                              <button onClick={() => onDelete(template.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                      {template.description && <p className="text-sm text-gray-600 mb-3">{template.description}</p>}
                      <div className="w-full flex justify-center mb-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-2" style={{ width: 240, height: 'auto', minHeight: 200 }}>
                          <div className="relative w-full" style={{ height: `${Math.max(200, Math.max(...template.layout.map((l: any) => (l.y + l.h) * 20)) + 10)}px` }}>
                            {template.layout.map((layoutItem: any) => {
                              const widget = template.widgets.find((w: any) => w.id === layoutItem.i)
                              if (!widget) return null
                              const ws = (template.widgetSettings?.[widget.id] || defaultWidgetSettings) as WidgetSettings
                              const bgColor = hexToRgba(ws.backgroundColor, ws.backgroundOpacity)
                              const cardBgColor = hexToRgba(ws.backgroundColor, ws.cardOpacity)
                              const categoryBgColor = ws.categoryBackgroundColor || defaultWidgetSettings.categoryBackgroundColor
                              return (
                                <div key={widget.id} className="rounded-lg shadow-md absolute" style={{ left: `${(layoutItem.x / 12) * 100}%`, top: `${layoutItem.y * 20}px`, width: `${(layoutItem.w / 12) * 100}%`, height: `${layoutItem.h * 20}px`, backgroundColor: bgColor, borderColor: ws.borderColor, borderWidth: `${ws.borderWidth}px`, borderStyle: 'solid', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                  <div className="p-1 flex-shrink-0" style={{ backgroundColor: categoryBgColor, height: `${Math.min(ws.categoryHeight, 20)}px`, borderBottom: ws.categoryBorderWidth > 0 ? `${ws.categoryBorderWidth}px solid ${ws.categoryBorderColor}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="text-xs font-semibold text-center" style={{ color: ws.categoryFontColor, fontFamily: ws.categoryFont, fontSize: `${Math.min(ws.categoryFontSize, 10)}px`, fontWeight: ws.categoryFontWeight }}></div>
                                  </div>
                                  <div className="p-1 flex-grow flex flex-col overflow-hidden">
                                    <div className="space-y-1 flex-grow overflow-y-auto">
                                      {Array.from({ length: 2 }).map((_, idx) => (
                                        <div key={idx} className="rounded shadow p-1" style={{ backgroundColor: cardBgColor, borderLeft: `2px solid ${ws.borderColor}`, fontFamily: ws.fontFamily, height: '20px' }} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500"><span>{template.widgets.length} widgets</span><span>{template.layout.length} layout items</span></div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => onApply(template)} disabled={isApplyingTemplate} className={`flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors ${isApplyingTemplate ? 'opacity-75 cursor-not-allowed' : ''}`}>{isApplyingTemplate ? 'Applying...' : 'Apply Template'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
                <button onClick={() => { setShowEditModal(false) }} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input type="text" value={templateName} onChange={(e) => (setTemplateName(e.target.value))} placeholder="Enter template name..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Describe your template..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Update Current Dashboard</p>
                      <p className="text-yellow-600 mt-1">This will update the template with your current dashboard layout and settings.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowEditModal(false) }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={onUpdateTemplate} disabled={isUpdatingTemplate} className={`flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors ${isUpdatingTemplate ? 'opacity-75 cursor-not-allowed' : ''}`}>{isUpdatingTemplate ? 'Updating...' : 'Update Template'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              {selectedTemplate.description && <p className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</p>}
              <div className="w-full flex justify-center mb-4">
                <div className="bg-white border border-gray-200 rounded-lg p-2" style={{ width: '100%', height: 'auto', minHeight: 200 }}>
                  <div className="relative w-full" style={{ height: `${Math.max(200, Math.max(...selectedTemplate.layout.map((l: any) => (l.y + l.h) * 25)) + 15)}px` }}>
                    {selectedTemplate.layout.map((layoutItem: any) => {
                      const widget = selectedTemplate.widgets.find((w: any) => w.id === layoutItem.i)
                      if (!widget) return null
                      const ws = (selectedTemplate.widgetSettings?.[widget.id] || defaultWidgetSettings) as WidgetSettings
                      const bgColor = hexToRgba(ws.backgroundColor, ws.backgroundOpacity)
                      const cardBgColor = hexToRgba(ws.backgroundColor, ws.cardOpacity)
                      const categoryBgColor = ws.categoryBackgroundColor || defaultWidgetSettings.categoryBackgroundColor
                      return (
                        <div key={widget.id} className="rounded-lg shadow-md absolute" style={{ left: `${(layoutItem.x / 12) * 100}%`, top: `${layoutItem.y * 25}px`, width: `${(layoutItem.w / 12) * 100}%`, height: `${layoutItem.h * 25}px`, backgroundColor: bgColor, borderColor: ws.borderColor, borderWidth: `${ws.borderWidth}px`, borderStyle: 'solid', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div className="p-1 flex-shrink-0" style={{ backgroundColor: categoryBgColor, height: `${Math.min(ws.categoryHeight, 20)}px`, borderBottom: ws.categoryBorderWidth > 0 ? `${ws.categoryBorderWidth}px solid ${ws.categoryBorderColor}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="text-xs font-semibold text-center" style={{ color: ws.categoryFontColor, fontFamily: ws.categoryFont, fontSize: `${Math.min(ws.categoryFontSize, 10)}px`, fontWeight: ws.categoryFontWeight }}></div>
                          </div>
                          <div className="p-1 flex-grow flex flex-col overflow-hidden">
                            <div className="space-y-1 flex-grow overflow-y-auto">
                              {Array.from({ length: 2 }).map((_, idx) => (
                                <div key={idx} className="rounded shadow p-1" style={{ backgroundColor: cardBgColor, borderLeft: `2px solid ${ws.borderColor}`, fontFamily: ws.fontFamily, height: '15px' }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-4"><span>{selectedTemplate.widgets.length} widgets</span><span>{selectedTemplate.layout.length} layout items</span></div>
              <button onClick={() => onApply(selectedTemplate)} disabled={isApplyingTemplate} className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium ${isApplyingTemplate ? 'opacity-75 cursor-not-allowed' : ''}`}>{isApplyingTemplate ? 'Applying Template...' : 'Apply Template'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


