'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Shield, CheckCircle, AlertCircle, Zap, Crown, Mail, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type TUser = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export default function MakeAdminPage() {
  const [users, setUsers] = useState<TUser[]>([])
  const [selectedEmail, setSelectedEmail] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true)
      const response = await fetch('/api/admin/all-users')
      const result = await response.json()

      console.log('API Response:', result)

      if (result.success) {
        // Robust filter: exclude SUPER_ADMIN regardless of order
        const filteredUsers = (Array.isArray(result.users) ? result.users : []).filter((u: any) => u.role !== 'SUPER_ADMIN')
        console.log('Filtered users:', filteredUsers)
        setUsers(filteredUsers)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error fetching users')
    } finally {
      setFetchingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmail) {
      toast.error('Please select a user')
      return
    }

    const selectedUser = users.find(user => user.email === selectedEmail)
    if (selectedUser?.role === 'ADMIN') {
      toast.error('This user is already an admin')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/update-role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedEmail,
          role: 'ADMIN'
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Admin role granted successfully!', {
          description: `${selectedUser?.name} now has full administrative privileges.`
        })
        setSelectedEmail('')
        fetchUsers() // Refresh the user list
      } else {
        toast.error(result.message || 'Failed to grant admin role')
      }
    } catch (error) {
      console.error('Error granting admin role:', error)
      toast.error('Error granting admin role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="relative">
          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
          <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 absolute -top-1 -right-1" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Make Admin
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Grant administrative privileges to existing users</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="border-2 border-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <UserPlus className="w-5 h-5" />
                Grant Administrator Role
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="user-select" className="text-sm font-semibold">
                    Select User * {!fetchingUsers && users.length > 0 && <span className="text-gray-500 font-normal">({users.length} users available)</span>}
                  </Label>
                  <Select
                    value={selectedEmail}
                    onValueChange={setSelectedEmail}
                    disabled={fetchingUsers}
                  >
                    <SelectTrigger className="w-full border-2 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder={fetchingUsers ? "Loading users..." : users.length === 0 ? "No users available" : "Choose a user from the list"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {users.length === 0 && !fetchingUsers ? (
                        <div className="p-4 text-center text-gray-500">No users found</div>
                      ) : (
                        users.map((user) => (
                        <SelectItem key={user.id} value={user.email}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span className="font-medium">{user.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Mail className="w-3 h-3" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={
                                user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' 
                                  ? 'default' 
                                  : user.role === 'MODERATOR' 
                                  ? 'secondary' 
                                  : 'outline'
                              }
                            >
                              {user.role}
                            </Badge>
                          </div>
                        </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Select an existing user to grant them administrator privileges
                  </p>
                </div>

                {selectedEmail && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-blue-900 mb-2">Selected User Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Name:</span>
                        <span>{users.find(u => u.email === selectedEmail)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Email:</span>
                        <span>{selectedEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Current Role:</span>
                        <Badge variant="outline">
                          {users.find(u => u.email === selectedEmail)?.role}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge variant="default">ADMIN</Badge>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !selectedEmail || fetchingUsers}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Granting Administrator Access...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Grant Administrative Access
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-blue-800 text-base sm:text-lg">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                Admin Privileges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="break-words">Full system access</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="break-words">User management</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="break-words">Dashboard creation</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="break-words">System settings</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-yellow-800 text-base sm:text-lg">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Security Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-start gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="break-words">Admin users have full system control</span>
              </div>
              <div className="flex items-start gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="break-words">Choose strong, unique passwords</span>
              </div>
              <div className="flex items-start gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="break-words">Monitor admin activities regularly</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-green-800 text-base sm:text-lg">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">∞</div>
                <div className="text-sm sm:text-base text-green-700 mt-1">Unlimited Access</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 