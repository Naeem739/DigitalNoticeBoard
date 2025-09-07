'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Calendar,
  FileText,
  ChevronDown,
  FolderPlus,
  X,
  Tag,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createCategory } from "@/app/actions/category.action"
import { BellLoader } from "@/components/ui/loader"

type TCategory = {
  id: string
  name: string
  description?: string
  categoryType: 'TEXT' | 'IMAGE' | 'PDF'
  createdAt: Date
  updatedAt: Date
  noticeCount?: number
}

const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Category name must be at least 2 characters.",
    })
    .max(50, {
      message: "Category name must not exceed 50 characters.",
    }),
  categoryType: z.enum(['TEXT', 'IMAGE', 'PDF']).default('TEXT'),
})

export default function CategoryPage() {
  const [categories, setCategories] = useState<TCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<TCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'noticeCount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      categoryType: "TEXT",
    },
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Filter and sort categories
    let filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort categories
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredCategories(filtered)
  }, [categories, searchTerm, sortBy, sortOrder])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/category/get-all')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.result || [])
      } else {
        toast.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Error fetching categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(categoryId)
      const response = await fetch(`/api/category/delete/${categoryId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Category deleted successfully')
        fetchCategories()
      } else {
        toast.error(data.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error deleting category')
    } finally {
      setDeletingId(null)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await createCategory(values)
      
      if (result.success) {
        toast.success("Category created successfully!", {
          description: "Your new category has been added to the system.",
          duration: 4000,
        })
        form.reset()
        setShowCreateForm(false)
        fetchCategories()
      } else {
        toast.error("Unable to create category", {
          description: result.message || "Please try a different name or category type.",
          duration: 5000,
        })
      }
    } catch (error) {
      toast("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
    return `${Math.floor(diffInDays / 7)} weeks ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BellLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Category Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Organize and manage your notice categories efficiently</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
            showCreateForm 
              ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl'
          }`}
        >
          {showCreateForm ? (
            <>
              <X className="w-5 h-5" />
              Hide Form
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Create Category
            </>
          )}
        </Button>
      </motion.div>

      {/* Create Category Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-6 bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-blue-600" />
                              Category Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="w-full h-12 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                                placeholder="Enter category name (e.g., News, Events, Announcements)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-purple-600" />
                              Category Type
                            </FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-12 px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white shadow-sm appearance-none cursor-pointer"
                                {...field}
                              >
                                <option value="TEXT" className="py-2">📝 Text Content</option>
                                <option value="IMAGE" className="py-2">🖼️ Image Content</option>
                                <option value="PDF" className="py-2">📄 PDF Document</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creating Category...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Create Category
                          </div>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false)
                          form.reset()
                        }}
                        className="h-12 px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search categories by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-gray-50"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'noticeCount')}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium hover:border-purple-300 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-gray-50 cursor-pointer"
            >
              <option value="createdAt">📅 Sort by Date</option>
              <option value="name">📝 Sort by Name</option>
              <option value="noticeCount">📊 Sort by Notice Count</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-12 px-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all font-semibold"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Categories List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    All Categories
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} found
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">
                    Total: {filteredCategories.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200 max-w-md mx-auto">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">No categories found</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {searchTerm 
                      ? 'No categories match your search criteria. Try adjusting your search terms.' 
                      : 'Get started by creating your first category to organize your notices effectively.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Category
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-200">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                  {category.name}
                                </h3>
                                <Badge variant={
                                  category.categoryType === 'TEXT' ? 'default' :
                                  category.categoryType === 'IMAGE' ? 'secondary' : 'outline'
                                } className="text-xs font-medium px-3 py-1 rounded-full">
                                  {category.categoryType === 'TEXT' ? '📝 Text' : 
                                   category.categoryType === 'IMAGE' ? '🖼️ Image' : '📄 PDF'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium">Created {getTimeAgo(category.createdAt)}</span>
                                </span>
                                {category.noticeCount !== undefined && (
                                  <span className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium">{category.noticeCount} {category.noticeCount === 1 ? 'notice' : 'notices'}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              disabled={deletingId === category.id}
                              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group-hover:bg-red-50"
                            >
                              {deletingId === category.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 