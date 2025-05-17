"use client"

import { TDashboard2, TNotice } from "@/types/types"
import { useState, useEffect } from "react"
import { Pencil, Trash2, X, Check, ChevronDown, Filter, AlertCircle, Search, Save, XCircle } from "lucide-react"
import { toast, Toaster } from "react-hot-toast"

interface WidgetContainerProps {
  data: TDashboard2
  onUpdate?: (updatedData: TDashboard2) => void
}

export function WidgetContainer({ data, onUpdate }: WidgetContainerProps) {
  // Deep clone data to make it mutable
  const [localData, setLocalData] = useState<TDashboard2>(JSON.parse(JSON.stringify(data)));
  const [notices, setNotices] = useState<TNotice[]>(data.notices || []);
  const [loading, setLoading] = useState(false);
  
  // States for category filter
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<TNotice | null>(null);
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Loading states for operations
  const [isLoading, setIsLoading] = useState<{id: string, operation: string} | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const noticesPerPage = 5;

  // Fetch all notices on component mount
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        console.log('Fetching notices...');
        const response = await fetch('/api/notice/get-all');
        const result = await response.json();
        console.log('Fetch result:', result);
        
        if (result.success) {
          setNotices(result.data);
          console.log('Notices set:', result.data);
        } else {
          console.error('Failed to fetch notices:', result.message);
          toast.error('Failed to fetch notices');
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
        toast.error('Failed to fetch notices');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // Get all unique categories from notices
  const categories = ["all", ...new Set(notices.map(notice => notice.categoryRelation?.name || 'Uncategorized'))];
  
  // Filter notices based on selected category and search term
  const filteredNotices = notices
    .filter(notice => notice.title && notice.title.trim() !== '')
    .filter(notice => selectedCategory === "all" || notice.categoryRelation?.name === selectedCategory)
    .filter(notice => 
      !searchTerm || 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notice.categoryRelation?.name && notice.categoryRelation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notice.content && notice.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  // Calculate pagination
  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalPages = Math.ceil(filteredNotices.length / noticesPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle opening the edit modal
  const handleEdit = (notice: TNotice) => {
    if (!notice || !notice.id) return;
    setEditingNotice({...notice});
    setEditModalOpen(true);
  };
  
  // Handle saving an edited notice
  const handleSaveEdit = async () => {
    if (!editingNotice || !editingNotice.title.trim()) {
      toast.error('Notice title cannot be empty');
      return;
    }
    
    try {
      setIsLoading({ id: editingNotice.id, operation: 'edit' });
      
      // Update notice in the Notice table in the database
      const response = await fetch(`/api/notice/update?id=${editingNotice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingNotice.title.trim(),
          content: editingNotice.content,
          category: editingNotice.category,
          categoryId: editingNotice.categoryId
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update notice');
      }
      
      // Update notice in the local state
      const updatedNotices = notices.map(notice => {
        if (notice.id === editingNotice.id) {
          return { ...editingNotice };
        }
        return notice;
      });
      
      setNotices(updatedNotices);
      
      // Show success message
      toast.success('Notice updated successfully!');
      
      // Close the modal
      setEditModalOpen(false);
      
    } catch (error) {
      console.error('Error updating notice:', error);
      toast.error('Failed to update notice. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };
  
  // Handle canceling an edit
  const handleCancelEdit = () => {
    setEditingNotice(null);
    setEditModalOpen(false);
  };
  
  // Handle deleting a notice
  const handleDelete = async (noticeId: string) => {
    try {
      setIsLoading({ id: noticeId, operation: 'delete' });
      
      // Delete notice from the Notice table in the database
      const response = await fetch(`/api/notice/delete?id=${noticeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notice');
      }
      
      // Remove notice from local state
      const updatedNotices = notices.filter(notice => notice.id !== noticeId);
      setNotices(updatedNotices);
      
      toast.success('Notice deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };
  
  // Confirmation before delete
  const confirmDelete = (noticeId: string, noticeTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the notice: "${noticeTitle}"?`)) {
      handleDelete(noticeId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg p-6 transition-all duration-300">
      {/* Toast configuration for top middle */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Notice Management
        </h1>
        
        <div className="flex flex-col md:flex-row w-full md:w-auto space-y-4 md:space-y-0 md:space-x-4">
          {/* Category filter dropdown - moved to left */}
          <div className="relative w-full md:w-64 order-2 md:order-1">
            <div 
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 cursor-pointer shadow-sm hover:shadow transition-all duration-200"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="flex items-center">
                <Filter className="h-4 w-4 text-indigo-500 mr-2" />
                <span className="text-gray-700">
                  {selectedCategory === "all" ? "All Categories" : selectedCategory}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
                {categories.map((category) => (
                  <div 
                    key={category}
                    className={`px-4 py-2 hover:bg-indigo-50 cursor-pointer transition-colors duration-150 ${selectedCategory === category ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowDropdown(false);
                    }}
                  >
                    {category === "all" ? "All Categories" : category}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Search bar - on right side */}
          <div className="relative w-full md:w-64 order-1 md:order-2">
            {showSearch ? (
              <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notices..."
                  className="w-full p-3 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchTerm("");
                  }}
                  className="p-3 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full md:w-auto flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-3 transition-colors duration-200 shadow-sm"
              >
                <Search className="h-5 w-5 mr-2" />
                <span>Search</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-10 border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">No notices found in the database</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-10 border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            {searchTerm
              ? "No notices match your search"
              : selectedCategory === "all" 
                ? "No notices found" 
                : `No notices found in the "${selectedCategory}" category`}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl shadow-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <th className="py-3 px-6 text-left font-medium tracking-wider">Category</th>
                    <th className="py-3 px-6 text-left font-medium tracking-wider">Notice</th>
                    <th className="py-3 px-6 text-center font-medium tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentNotices.map((notice, index) => (
                    <tr 
                      key={notice.id || index} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors duration-150`}
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {notice.categoryRelation?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">{notice.title}</span>
                          {notice.content && (
                            <span className="text-gray-500 text-sm mt-1 truncate max-w-md">
                              {notice.content.substring(0, 100)}
                              {notice.content.length > 100 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleEdit(notice)}
                            disabled={isLoading !== null}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Edit Notice"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(notice.id, notice.title)}
                            disabled={isLoading !== null}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete Notice"
                          >
                            {isLoading?.id === notice.id && isLoading?.operation === 'delete' ? (
                              <span className="h-5 w-5 block rounded-full border-2 border-t-transparent border-red-600 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === index + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors duration-150`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Next
              </button>
            </div>
          )}

          {/* Page Info */}
          {filteredNotices.length > 0 && (
            <div className="text-center text-gray-600 mt-4">
              Showing {indexOfFirstNotice + 1} to {Math.min(indexOfLastNotice, filteredNotices.length)} of {filteredNotices.length} notices
            </div>
          )}
        </>
      )}

      {/* Edit Notice Modal */}
      {editModalOpen && editingNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-t-xl">
              <h3 className="text-xl font-semibold">Edit Notice</h3>
              <button 
                onClick={handleCancelEdit}
                className="p-1 hover:bg-indigo-700 rounded-full transition-colors duration-150"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-800">
                    {editingNotice.categoryRelation?.name || 'Uncategorized'}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Category cannot be changed from this interface
                  </p>
                </div>
                
                {/* Title */}
                <div>
                  <label htmlFor="notice-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Notice Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="notice-title"
                    type="text"
                    value={editingNotice.title}
                    onChange={(e) => setEditingNotice({...editingNotice, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                    placeholder="Enter notice title"
                  />
                </div>
                
                {/* Content */}
                <div>
                  <label htmlFor="notice-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Notice Content
                  </label>
                  <textarea
                    id="notice-content"
                    value={editingNotice.content || ''}
                    onChange={(e) => setEditingNotice({...editingNotice, content: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 min-h-64"
                    placeholder="Enter notice content (optional)"
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCancelEdit}
                disabled={isLoading?.id === editingNotice.id}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-150 flex items-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isLoading?.id === editingNotice.id || !editingNotice.title.trim()}
                className={`px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-150 flex items-center gap-2 ${!editingNotice.title.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading?.id === editingNotice.id && isLoading?.operation === 'edit' ? (
                  <span className="h-5 w-5 block rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}