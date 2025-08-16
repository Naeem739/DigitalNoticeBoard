'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, UserCheck, Calendar, Mail, User, Trash2, Edit, Search, Shield, Activity, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

type TModerator = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export default function ShowAllModeratorPage() {
  const [moderators, setModerators] = useState<TModerator[]>([])
  const [filteredModerators, setFilteredModerators] = useState<TModerator[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchModerators()
  }, [])

  useEffect(() => {
    // Filter and sort moderators
    let filtered = moderators.filter(moderator => 
      moderator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moderator.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort moderators
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredModerators(filtered)
  }, [moderators, searchTerm, sortBy, sortOrder])

  const fetchModerators = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/allModerators')
      const result = await response.json()
      
      if (response.ok) {
        setModerators(result.moderators || [])
      } else {
        toast.error('Failed to fetch moderator users')
      }
    } catch (error) {
      console.error('Error fetching moderators:', error)
      toast.error('Error fetching moderator users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteModerator = async (moderatorId: string, moderatorName: string) => {
    if (!confirm(`Are you sure you want to delete moderator "${moderatorName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(moderatorId)
      const response = await fetch(`/api/admin/delete/${moderatorId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        setModerators(prev => prev.filter(moderator => moderator.id !== moderatorId))
        toast.success(`Moderator "${moderatorName}" deleted successfully`)
      } else {
        toast.error(result.message || 'Failed to delete moderator')
      }
    } catch (error) {
      console.error('Error deleting moderator:', error)
      toast.error('Error deleting moderator')
    } finally {
      setDeletingId(null)
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

  const getTimeAgo = (date: Date) => {
    if (typeof window === 'undefined') return 'Loading...';
    
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading moderator users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-blue-500" />
            <UserCheck className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              All Moderators
            </h1>
            <p className="text-gray-600 mt-1">Manage all moderator users in the system</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-green-600" />
          <Badge variant="secondary" className="text-lg font-semibold">
            {filteredModerators.length} {filteredModerators.length === 1 ? 'Moderator' : 'Moderators'}
          </Badge>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search moderators by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'createdAt')}
            className="px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-800">{moderators.length}</div>
                <div className="text-sm text-blue-600">Total Moderators</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-800">{filteredModerators.length}</div>
                <div className="text-sm text-green-600">Active Results</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-800">⚡</div>
                <div className="text-sm text-purple-600">Moderate Access</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {filteredModerators.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? 'No matching moderators found' : 'No Moderator Users Found'}
              </h3>
              <p className="text-gray-500 text-center">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.'
                  : 'No moderator users have been created yet. Moderator users will appear here once they are added to the system.'
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredModerators.map((moderator, index) => (
              <motion.div
                key={moderator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="relative">
                          <User className="w-5 h-5 text-blue-600" />
                          <Shield className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
                        </div>
                        <span className="truncate">{moderator.name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteModerator(moderator.id, moderator.name)}
                          disabled={deletingId === moderator.id}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          title="Delete Moderator"
                        >
                          {deletingId === moderator.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{moderator.email}</p>
                          <p className="text-xs text-gray-500">Email Address</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{formatDate(moderator.createdAt)}</p>
                          <p className="text-xs text-gray-500">{getTimeAgo(moderator.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <Badge variant="secondary" className="text-xs">
                            {moderator.role}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">Role</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="text-xs text-gray-500 mt-1">
                        Joining Date: {formatDate(moderator.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Shield className="w-5 h-5" />
              Moderator Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                Moderator users have limited access to system features and can manage notices and categories.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                You can delete moderator users, but be careful as this action cannot be undone.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                To add new moderator users, use the "Make Moderator" page in the Admin section.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
