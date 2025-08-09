"use client"

import { TDashboard2, TNotice, Category } from "@/types/types"
import { useState, useEffect } from "react"
import { Pencil, Trash2, X, Check, ChevronDown, Filter, AlertCircle, Search, Save, XCircle, Download } from "lucide-react"
import { toast, Toaster } from "react-hot-toast"

interface WidgetContainerProps {
  data: TDashboard2
  onUpdate?: (updatedData: TDashboard2) => void
}

export function WidgetContainer({ data, onUpdate }: WidgetContainerProps) {
  // Deep clone data to make it mutable
  const [localData, setLocalData] = useState<TDashboard2>(() => {
    if (typeof window === 'undefined') {
      return data;
    }
    return JSON.parse(JSON.stringify(data));
  });
  const [notices, setNotices] = useState<TNotice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for category filter
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<TNotice | null>(null);
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // State for image preview
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  
  // State for image upload in edit modal
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // State for PDF preview
  const [showPdfPreview, setShowPdfPreview] = useState<string | null>(null);
  
  // State for PDF upload in edit modal
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  
  // Loading states for operations
  const [isLoading, setIsLoading] = useState<{id: string, operation: string} | null>(null);

  const [isClient, setIsClient] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const noticesPerPage = 5;

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch all notices on component mount
  useEffect(() => {
    if (!isClient) return;
    
    const fetchNotices = async () => {
      try {
        console.log('Fetching notices...');
        const response = await fetch('/api/notice/get-all');
        const result = await response.json();
        console.log('Fetch result:', result);
        
        if (result.success) {
          setNotices(result.result || []);
          console.log('Notices set:', result.result);
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
  }, [isClient]);

  // Get unique categories from notices for filter dropdown
  const categoryOptions = ["all", ...new Set(notices.map(notice => notice.categoryName || 'Uncategorized'))];
  
  // Filter notices based on selected category and search term
  const filteredNotices = notices
    .filter(notice => notice.title && notice.title.trim() !== '')
    .filter(notice => selectedCategory === "all" || notice.categoryName === selectedCategory)
    .filter(notice => 
      !searchTerm || 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notice.categoryName && notice.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
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
    
    // Reset image states
    setSelectedImage(null);
    setImagePreview(null);
    
    // Reset PDF states
    setSelectedPdf(null);
    setPdfPreview(null);
    
    // Set current image preview if notice has image
    if (notice.imageData) {
      setImagePreview(`data:image/jpeg;base64,${notice.imageData}`);
    }
    
    // Set current PDF preview if notice has PDF
    if (notice.pdfData) {
      setPdfPreview(`data:application/pdf;base64,${notice.pdfData}`);
    }
  };
  
  // Convert PDF to base64
  const convertPdfToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 data (remove data:application/pdf;base64, prefix)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle saving an edited notice
  const handleSaveEdit = async () => {
    if (!editingNotice || !editingNotice.title.trim()) {
      toast.error('Notice title cannot be empty');
      return;
    }
    
    try {
      setIsLoading({ id: editingNotice.id, operation: 'edit' });
      
      // Prepare update data
      const updateData: any = {
        title: editingNotice.title.trim(),
        category: editingNotice.category,
        categoryId: editingNotice.categoryId
      };

      // Handle image upload if a new image is selected
      if (selectedImage) {
        try {
          const base64Data = await convertImageToBase64(selectedImage);
          updateData.imageData = base64Data;
          updateData.imageFileName = selectedImage.name;
          updateData.imageUrl = null; // Clear URL if using base64 data
        } catch (error) {
          console.error('Error converting image to base64:', error);
          toast.error('Failed to process image. Please try again.');
          return;
        }
      }
      
      // Handle PDF upload if a new PDF is selected
      if (selectedPdf) {
        try {
          const base64Data = await convertPdfToBase64(selectedPdf);
          updateData.pdfData = base64Data;
          updateData.pdfFileName = selectedPdf.name;
          updateData.pdfUrl = null; // Clear URL if using base64 data
        } catch (error) {
          console.error('Error converting PDF to base64:', error);
          toast.error('Failed to process PDF. Please try again.');
          return;
        }
      }
      
      // Update notice in the Notice table in the database
      const response = await fetch(`/api/notice/update?id=${editingNotice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update notice');
      }
      
      // Update notice in the local state with new image and PDF data
      const updatedNotices = notices.map(notice => {
        if (notice.id === editingNotice.id) {
          return { 
            ...editingNotice,
            imageData: updateData.imageData || notice.imageData,
            imageFileName: updateData.imageFileName || notice.imageFileName,
            pdfData: updateData.pdfData || notice.pdfData,
            pdfFileName: updateData.pdfFileName || notice.pdfFileName
          };
        }
        return notice;
      });
      
      setNotices(updatedNotices);
      
      // Show success message
      toast.success('Notice updated successfully!');
      
      // Close the modal and reset states
      setEditModalOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedPdf(null);
      setPdfPreview(null);
      
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
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedPdf(null);
    setPdfPreview(null);
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

  // Handle image preview toggle
  const toggleImagePreview = (noticeId: string) => {
    setShowImagePreview(showImagePreview === noticeId ? null : noticeId);
  };

  // Handle PDF preview toggle
  const togglePdfPreview = (noticeId: string) => {
    setShowPdfPreview(showPdfPreview === noticeId ? null : noticeId);
  };

  // Add download function for images
  const handleDownload = (notice: TNotice) => {
    if (!notice.imageData) {
      toast.error('No image to download');
      return;
    }

    try {
      // Create a blob from the base64 image data
      const byteCharacters = atob(notice.imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = notice.imageFileName || `${notice.title || 'notice'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  // Add download function for PDFs
  const handlePdfDownload = (notice: TNotice) => {
    if (!notice.pdfData) {
      toast.error('No PDF to download');
      return;
    }

    try {
      // Create a blob from the base64 PDF data
      const byteCharacters = atob(notice.pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = notice.pdfFileName || `${notice.title || 'notice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle PDF file selection
  const handlePdfSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Please select a valid PDF file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('PDF file size must be less than 10MB');
        return;
      }
      
      setSelectedPdf(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert image to base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 data (remove data:image/...;base64, prefix)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Test function to add a sample notice with image data
  const addTestNoticeWithImage = async () => {
    try {
      // Sample base64 image data (1x1 pixel transparent PNG)
      const sampleImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const testNotice = {
        title: 'Test Notice with Image',
        category: 'Test',
        categoryId: notices[0]?.categoryId || 'test-category',
        imageFileName: 'test-image.png',
        imageData: sampleImageData
      };

      // Use the createNotice action directly
      const { createNotice } = await import('@/app/actions/notice.action');
      const result = await createNotice(testNotice);
      
      if (result.success) {
        toast.success('Test notice with image created successfully!');
        // Refresh the notices list
        window.location.reload();
      } else {
        toast.error('Failed to create test notice: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating test notice:', error);
      toast.error('Failed to create test notice');
    }
  };

  if (!isClient || loading) {
    return (
      <div className="flex justify-center items-center h-64 w-full" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg transition-all duration-300 pb-20" suppressHydrationWarning>
      <div className="p-6">
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
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-auto" suppressHydrationWarning>
                {categoryOptions.map((category) => (
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
              <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" suppressHydrationWarning>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or category..."
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
        <div className="flex flex-col items-center justify-center bg-white rounded-lg p-10 border border-gray-200" suppressHydrationWarning>
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">No notices found in the database</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg p-10 border border-gray-200" suppressHydrationWarning>
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
          <div className="overflow-hidden rounded-xl shadow-md border border-gray-200" suppressHydrationWarning>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <th className="py-3 px-6 text-left font-medium tracking-wider">Category</th>
                    <th className="py-3 px-6 text-left font-medium tracking-wider">Notice Title</th>
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
                           {notice.categoryName || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">{notice.title}</span>
                          {/* Image controls */}
                          {notice.imageData && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Image Attachment</span>
                                <span className="text-xs text-gray-500">{notice.imageFileName || 'Image'}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => toggleImagePreview(notice.id)}
                                  className="flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {showImagePreview === notice.id ? 'Hide Preview' : 'Show Preview'}
                                </button>
                                <button
                                  onClick={() => handleEdit(notice)}
                                  className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDownload(notice)}
                                  className="flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors font-medium"
                                >
                                  <Download className="w-4 h-4 mr-1.5" />
                                  Download
                                </button>
                              </div>
                              {showImagePreview === notice.id && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="font-bold text-sm mb-2 text-gray-700">Image Preview</div>
                                  <img
                                    src={`data:image/jpeg;base64,${notice.imageData}`}
                                    alt={notice.title}
                                    className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200 shadow-sm"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* PDF controls */}
                          {notice.pdfData && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">PDF Attachment</span>
                                <span className="text-xs text-gray-500">{notice.pdfFileName || 'PDF'}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => togglePdfPreview(notice.id)}
                                  className="flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {showPdfPreview === notice.id ? 'Hide Preview' : 'Show Preview'}
                                </button>
                                <button
                                  onClick={() => handleEdit(notice)}
                                  className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handlePdfDownload(notice)}
                                  className="flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors font-medium"
                                >
                                  <Download className="w-4 h-4 mr-1.5" />
                                  Download
                                </button>
                              </div>
                              {showPdfPreview === notice.id && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="font-bold text-sm mb-2 text-gray-700">PDF Preview</div>
                                  <iframe
                                    src={`data:application/pdf;base64,${notice.pdfData}`}
                                    className="w-full h-64 border border-gray-200 rounded-lg"
                                    title="PDF Preview"
                                  />
                                </div>
                              )}
                            </div>
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


        </>
      )}
      </div>

      {/* Fixed Pagination Footer */}
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40" suppressHydrationWarning>
          <div className="flex justify-center items-center space-x-2 py-4 px-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                } transition-colors duration-150 shadow-sm`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm"
            >
              Next
            </button>
            
            {/* Page Info */}
            {filteredNotices.length > 0 && (
              <div className="ml-6 text-sm text-gray-600 border-l border-gray-300 pl-6">
                Showing {indexOfFirstNotice + 1} to {Math.min(indexOfLastNotice, filteredNotices.length)} of {filteredNotices.length} notices
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {editModalOpen && editingNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" suppressHydrationWarning>
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
                     {editingNotice.categoryName || 'Uncategorized'}
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white text-gray-900"
                    placeholder="Enter notice title"
                  />
                </div>
                
                {/* Notice Content - Show only when content is not empty */}
                {editingNotice.content && editingNotice.content.trim() !== '' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notice Content
                    </label>
                    <div className="space-y-4">
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white text-gray-900"
                        value={editingNotice.content}
                        onChange={(e) => setEditingNotice({...editingNotice, content: e.target.value})}
                        rows={6}
                        placeholder="Enter notice content"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Image Upload - Show only when imageData is not empty */}
                    {editingNotice.imageData && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notice Image
                        </label>
                        <div className="space-y-4">
                          {/* Current Image Display */}
                          {imagePreview && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Current Image</span>
                                {editingNotice.imageFileName && (
                                  <span className="text-xs text-gray-500">{editingNotice.imageFileName}</span>
                                )}
                              </div>
                              <img
                                src={imagePreview}
                                alt="Current notice image"
                                className="max-w-xs max-h-32 object-contain rounded border border-gray-200"
                              />
                            </div>
                          )}

                          {/* Image Upload Input */}
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {selectedImage ? 'Change Image' : 'Upload New Image'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                            
                            {selectedImage && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{selectedImage.name}</span>
                                <button
                                  onClick={() => {
                                    setSelectedImage(null);
                                    setImagePreview(editingNotice.imageData ? `data:image/jpeg;base64,${editingNotice.imageData}` : null);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Help Text */}
                          <p className="text-xs text-gray-500">
                            {selectedImage 
                              ? 'New image will replace the current one when you save.'
                              : 'Upload a new image to replace the current one, or leave empty to keep the current image.'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    {/* PDF Upload - Show only when imageData is empty */}
                    {!editingNotice.imageData && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notice PDF
                        </label>
                        <div className="space-y-4">
                          {/* Current PDF Display */}
                          {pdfPreview && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Current PDF</span>
                                {editingNotice.pdfFileName && (
                                  <span className="text-xs text-gray-500">{editingNotice.pdfFileName}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-600">PDF Document</span>
                              </div>
                            </div>
                          )}

                          {/* PDF Upload Input */}
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {selectedPdf ? 'Change PDF' : 'Upload New PDF'}
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfSelect}
                                className="hidden"
                              />
                            </label>
                            
                            {selectedPdf && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{selectedPdf.name}</span>
                                <button
                                  onClick={() => {
                                    setSelectedPdf(null);
                                    setPdfPreview(editingNotice.pdfData ? `data:application/pdf;base64,${editingNotice.pdfData}` : null);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Help Text */}
                          <p className="text-xs text-gray-500">
                            {selectedPdf 
                              ? 'New PDF will replace the current one when you save.'
                              : 'Upload a new PDF to replace the current one, or leave empty to keep the current PDF.'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
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