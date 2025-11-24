'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, UserCheck, Calendar, Mail, User, Trash2, Search, Shield, Activity, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

type TUser = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export default function ShowAllUsersPage() {
  const [users, setUsers] = useState<TUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<TUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Filter and sort users
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort users - fix type issues!
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      if (sortBy === 'createdAt') {
        aValue = typeof a.createdAt === 'string' || a.createdAt instanceof Date ? new Date(a.createdAt).getTime() : 0
        bValue = typeof b.createdAt === 'string' || b.createdAt instanceof Date ? new Date(b.createdAt).getTime() : 0
      } else if (sortBy === 'name') {
        aValue = String(a.name).toLowerCase()
        bValue = String(b.name).toLowerCase()
      } else if (sortBy === 'email') {
        aValue = String(a.email).toLowerCase()
        bValue = String(b.email).toLowerCase()
      } else {
        aValue = ''
        bValue = ''
      }

      if (sortOrder === 'asc') {
        if (aValue > bValue) return 1
        if (aValue < bValue) return -1
        return 0
      } else {
        if (aValue < bValue) return 1
        if (aValue > bValue) return -1
        return 0
      }
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, sortBy, sortOrder])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/allUsers')
      const result = await response.json()
      
      if (response.ok) {
        setUsers(result.users || [])
      } else {
        toast.error('Failed to fetch user accounts')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error fetching user accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(userId)
      const response = await fetch(`/api/admin/delete/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId))
        toast.success(`User "${userName}" deleted successfully`)
      } else {
        toast.error(result.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user')
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
          <p className="text-gray-600">Loading user accounts...</p>
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
            <Users className="w-8 h-8 text-blue-500" />
            <UserCheck className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              All Users
            </h1>
            <p className="text-gray-600 mt-1">Manage all user accounts in the system</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-green-600" />
          <Badge variant="secondary" className="text-lg font-semibold">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
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
            placeholder="Search users by name or email..."
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
                <div className="text-2xl font-bold text-blue-800">{users.length}</div>
                <div className="text-sm text-blue-600">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-800">{filteredUsers.length}</div>
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
                <div className="text-2xl font-bold text-purple-800">👤</div>
                <div className="text-sm text-purple-600">User Access</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {filteredUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? 'No matching users found' : 'No User Accounts Found'}
              </h3>
              <p className="text-gray-500 text-center">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.'
                  : 'No user accounts have been created yet. User accounts will appear here once they are added to the system.'
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
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
                        <span className="truncate">{user.name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={deletingId === user.id}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          title="Delete User"
                        >
                          {deletingId === user.id ? (
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
                          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500">Email Address</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
                          <p className="text-xs text-gray-500">{getTimeAgo(user.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">Role</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="text-xs text-gray-500 mt-1">
                        Joining Date: {formatDate(user.createdAt)}
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
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                User accounts have basic access to view notices and use the system features.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                You can delete user accounts, but be careful as this action cannot be undone.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-600">
                To add new user accounts, use the &quot;Add User&quot; page in the Admin section.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
