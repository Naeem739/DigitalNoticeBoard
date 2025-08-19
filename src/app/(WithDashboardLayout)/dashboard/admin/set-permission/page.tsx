'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Shield, UserCheck, Save, ListChecks, CheckCircle2, Circle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

type TModerator = {
  id: string
  name: string
  email: string
}

type TManageablePage = {
  route: string
  label: string
}

export default function SetPermissionPage() {
  const { data: session } = useSession()
  const [moderators, setModerators] = useState<TModerator[]>([])
  const [pages, setPages] = useState<TManageablePage[]>([])
  const [selectedModeratorId, setSelectedModeratorId] = useState<string>('')
  const [allowed, setAllowed] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [emailQuery, setEmailQuery] = useState('')
  const [dirty, setDirty] = useState(false)

  const emailFilteredModerators = useMemo(() => {
    const q = emailQuery.toLowerCase()
    return moderators.filter(m => m.email.toLowerCase().includes(q))
  }, [moderators, emailQuery])

  useEffect(() => {
    // Fetch moderators and pages on mount to avoid SSR hydration issues
    const load = async () => {
      try {
        setLoading(true)
        const [modsRes, pagesRes] = await Promise.all([
          fetch('/api/admin/allModerators'),
          fetch('/api/admin/permissions/pages'),
        ])
        const modsJson = await modsRes.json()
        const pagesJson = await pagesRes.json()
        setModerators((modsJson.moderators || []).map((m: any) => ({ id: m.id, name: m.name, email: m.email })))
        setPages(pagesJson.pages || [])
      } catch (e) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    // When moderator changes, fetch their allowed routes
    const fetchPerms = async () => {
      if (!selectedModeratorId) {
        // Ensure Home ('/') and Dashboard ('/dashboard') are always present as default when nothing is selected
        setAllowed(['/', '/dashboard'])
        setDirty(false)
        return
      }
      try {
        const res = await fetch(`/api/admin/permissions/${selectedModeratorId}`)
        const json = await res.json()
        // Always include Home ('/') and Dashboard ('/dashboard') as default allowed routes
        const routes: string[] = Array.isArray(json.allowedRoutes) ? json.allowedRoutes : []
        const withDefaults = Array.from(new Set<string>(['/', '/dashboard', ...routes]))
        setAllowed(withDefaults)
        setDirty(false)
      } catch (e) {
        setAllowed(['/', '/dashboard'])
        setDirty(false)
      }
    }
    fetchPerms()
  }, [selectedModeratorId])

  const toggleRoute = (route: string, checked: boolean) => {
    setAllowed(prev => {
      const next = new Set(prev)
      if (checked) next.add(route)
      else next.delete(route)
      setDirty(true)
      return Array.from(next)
    })
  }

  const handleSelectAll = () => {
    setAllowed(pages.map(p => p.route))
    setDirty(true)
  }

  const handleClearAll = () => {
    // Keep Home ('/') and Dashboard ('/dashboard') as defaults even when clearing
    setAllowed(['/', '/dashboard'])
    setDirty(true)
  }

  const handleSave = async () => {
    if (!selectedModeratorId) {
      toast.error('Select a moderator first')
      return
    }
    try {
      setSaving(true)
      // Ensure dashboard route is always included in the saved permissions
      const routesToSave = Array.from(new Set<string>(['/', '/dashboard', ...allowed.filter(route => route !== '/' && route !== '/dashboard')]))
      const res = await fetch(`/api/admin/permissions/${selectedModeratorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedRoutes: routesToSave })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Permissions updated')
        setDirty(false)
      } else {
        toast.error(json.message || 'Failed to update permissions')
      }
    } catch (e) {
      toast.error('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="w-full space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <UserCheck className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent tracking-tight">
                  Permission Management
                </h1>
                <p className="text-gray-600 mt-3 text-xl font-medium leading-relaxed">
                  Configure access controls and permissions for moderator accounts
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Active Session</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moderator Selection Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Select Moderator</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Moderator Email</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full h-12 rounded-xl border border-gray-200 px-4 text-left text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 bg-white">
                      {selectedModeratorId ? (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-medium">{moderators.find(m => m.id === selectedModeratorId)?.email}</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      ) : (
                        <span className="text-gray-500 font-medium">Select moderator email</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 p-4 shadow-xl border-gray-200">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Search Moderators</Label>
                        <Input
                          placeholder="Type to search..."
                          value={emailQuery}
                          onChange={(e) => setEmailQuery(e.target.value)}
                          className="h-10 font-medium"
                        />
                      </div>
                      <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
                        {emailFilteredModerators.map((m) => (
                          <button
                            key={m.id}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors duration-200 ${
                              selectedModeratorId === m.id ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                            }`}
                            onClick={() => setSelectedModeratorId(m.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {m.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{m.name}</div>
                                <div className="text-xs text-gray-500 font-medium">{m.email}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {emailFilteredModerators.length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="font-medium">No moderators found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              {selectedModeratorId && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-900">Moderator Selected</p>
                      <p className="text-xs text-green-700 font-medium">Ready to configure permissions</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Configuration Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <ListChecks className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Page Permissions</h2>
                    <p className="text-sm text-gray-600 font-medium">Configure access to specific pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-bold text-sm">
                    {allowed.length}/{pages.length} Allowed
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearAll} 
                      disabled={!selectedModeratorId}
                      className="h-8 px-3 text-xs font-semibold"
                    >
                      Clear All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSelectAll} 
                      disabled={!selectedModeratorId}
                      className="h-8 px-3 text-xs font-semibold"
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {!selectedModeratorId ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Select a Moderator</h3>
                  <p className="text-gray-500 font-medium text-lg leading-relaxed">Choose a moderator from the left panel to configure their permissions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pages.map((p, idx) => {
                      const isDefault = p.route === '/' || p.route === '/dashboard'
                      const isChecked = isDefault || allowed.includes(p.route)
                      return (
                        <button
                          key={p.route}
                          type="button"
                          role="checkbox"
                          aria-checked={isChecked}
                          aria-disabled={isDefault}
                          aria-label={`${isDefault ? 'Default: Always allowed' : (isChecked ? 'Revoke' : 'Allow') + ' access to ' + p.label}`}
                          onClick={() => {
                            if (isDefault) return
                            const currentlyAllowed = allowed.includes(p.route)
                            toggleRoute(p.route, !currentlyAllowed)
                          }}
                          className={cn(
                            'group relative flex items-center justify-between p-4 border rounded-xl text-left transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98] transform-gpu',
                            isChecked
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm hover:shadow-lg hover:ring-1 hover:ring-green-200'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg hover:ring-1 hover:ring-blue-200 hover:-translate-y-0.5'
                            , isDefault ? 'cursor-default ring-1 ring-blue-200 border-blue-200 bg-blue-50' : 'cursor-pointer'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 shadow-sm',
                              isChecked 
                                ? 'bg-green-100 ring-2 ring-green-200' 
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            )}>
                              {isChecked ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 transition-transform duration-300 group-hover:scale-110" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:scale-110" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <span className={cn('font-bold text-base tracking-tight', isChecked ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900')}>
                                {p.label}
                              </span>
                              {p.route === '/dashboard' && (
                                <div className="text-xs text-blue-600 mt-1 font-bold">Always available for moderators</div>
                              )}
                            </div>
                          </div>
                          {isChecked && (
                            <span className={cn(
                              'ml-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-transform duration-300 shadow-sm',
                              isDefault ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'
                            )}>
                              {isDefault ? 'Default' : 'Allowed'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold">Changes will be applied immediately</span>
                      </div>
                      <Button 
                        onClick={handleSave} 
                        disabled={!selectedModeratorId || !dirty || saving} 
                        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg font-bold text-base px-6 py-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving Changes...' : 'Save Permissions'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


