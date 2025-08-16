'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Zap, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function MakeUserPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Calculate password strength
    if (name === 'password') {
      let strength = 0
      if (value.length >= 8) strength += 25
      if (/[a-z]/.test(value)) strength += 25
      if (/[A-Z]/.test(value)) strength += 25
      if (/[0-9]/.test(value)) strength += 25
      setPasswordStrength(strength)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500'
    if (passwordStrength <= 50) return 'bg-orange-500'
    if (passwordStrength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak'
    if (passwordStrength <= 50) return 'Fair'
    if (passwordStrength <= 75) return 'Good'
    return 'Strong'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (passwordStrength < 75) {
      toast.error('Please choose a stronger password')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'user'
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('User account created successfully!', {
          description: `${formData.name} now has user access to the system.`
        })
        setFormData({ name: '', email: '', password: '', confirmPassword: '' })
        setPasswordStrength(0)
      } else {
        toast.error(result.message || 'Failed to create user account')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Error creating user account')
    } finally {
      setLoading(false)
    }
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
            <UserPlus className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Add New User
            </h1>
            <p className="text-gray-600 mt-1">Create a new user account with basic access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <Badge variant="outline" className="text-lg font-semibold">
            User Role
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <UserPlus className="w-6 h-6" />
                User Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="border-2 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-2 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="border-2 focus:border-blue-500 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {passwordStrength >= 75 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span>
                          {passwordStrength >= 75 
                            ? 'Password strength is good' 
                            : 'Password should be at least 8 characters with mixed case and numbers'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="border-2 focus:border-blue-500 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating User Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Create User Account
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* User Role Info */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Shield className="w-5 h-5" />
                User Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Access to view notices and content</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Browse image and PDF notices</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Access to public notice board</p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Cannot create or manage notices</p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Cannot access admin features</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Zap className="w-5 h-5" />
                Security Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">Use strong, unique passwords</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">Verify email addresses carefully</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">Ensure proper name formatting</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <UserCheck className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role Level:</span>
                <Badge variant="outline" className="text-xs">Basic Access</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Permissions:</span>
                <Badge variant="secondary" className="text-xs">Read Only</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dashboard Access:</span>
                <Badge variant="outline" className="text-xs">Limited</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
