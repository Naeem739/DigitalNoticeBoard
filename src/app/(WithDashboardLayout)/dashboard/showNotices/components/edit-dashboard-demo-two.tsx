"use client"

import { TDashboard2, TNotice, Category } from "@/types/types"
import { useState, useEffect } from "react"
import { Pencil, Trash2, X, Check, ChevronDown, Filter, AlertCircle, Search, Save, XCircle, Download, FileText } from "lucide-react"
import { toast, Toaster } from "react-hot-toast"
import { useSession } from "next-auth/react"
import { deleteAllNotices, deleteNoticesByCategory } from "@/app/actions/notice.action"

interface WidgetContainerProps {
  data: TDashboard2
  onUpdate?: (updatedData: TDashboard2) => void
}

export function WidgetContainer({ data, onUpdate }: WidgetContainerProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  
  // Deep clone data to make it mutable
  const [localData, setLocalData] = useState<TDashboard2>(data);
  const [notices, setNotices] = useState<TNotice[]>([]);
  // Map for ordering Dashboard Images by creation time
  const [dashboardImageOrderMap, setDashboardImageOrderMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // States for category filter
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCategoryType, setSelectedCategoryType] = useState("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryTypeDropdown, setShowCategoryTypeDropdown] = useState(false);
  
  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<TNotice | null>(null);
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // State for image upload in edit modal
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // State for PDF upload in edit modal
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  
  // Loading states for operations
  const [isLoading, setIsLoading] = useState<{id: string, operation: string} | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // State for content modal
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{title: string, content: string, category: string} | null>(null);

  // State for image modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageContent, setSelectedImageContent] = useState<{title: string, imageData: string, fileName: string} | null>(null);

  // State for PDF modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfContent, setSelectedPdfContent] = useState<{title: string, pdfData: string, fileName: string} | null>(null);

  const [isClient, setIsClient] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const noticesPerPage = 5;

  // Add state for categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Helper: get display name for a category
  const getCategoryDisplayName = (cat: Category) => cat.editedName || cat.name;
  // Helper: build unique option label including type to avoid ambiguity
  const getCategoryOptionLabel = (cat: Category) => `${getCategoryDisplayName(cat)} (${cat.categoryType})`;
  // Helper: list of categories visible for current selected type
  const getVisibleCategories = () =>
    selectedCategoryType === "all"
      ? categories
      : categories.filter(c => c.categoryType === selectedCategoryType);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  // Reset current page when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedCategoryType]);

  // Fetch all notices on component mount
  useEffect(() => {
    if (!isClient) return;
    
    const fetchNotices = async () => {
      try {
        const response = await fetch('/api/notice/get-all');
        const result = await response.json();
        
        if (result.success) {
          const noticesData = result.result || [];
          console.log('Fetched notices with image/PDF data:', noticesData.filter((notice: any) => 
            notice.imageData || notice.imageFileName || notice.imageUrl || notice.pdfData || notice.pdfFileName || notice.pdfUrl
          ).map((notice: any) => ({
            title: notice.title,
            categoryId: notice.categoryId,
            categoryType: notice.categoryType,
            hasImageData: !!notice.imageData,
            hasImageFileName: !!notice.imageFileName,
            hasImageUrl: !!notice.imageUrl,
            hasPdfData: !!notice.pdfData,
            hasPdfFileName: !!notice.pdfFileName,
            hasPdfUrl: !!notice.pdfUrl
          })));
          setNotices(noticesData);
        } else {
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

  // Fetch all categories on component mount
  useEffect(() => {
    if (!isClient) return;
    
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/category/get-all');
        const result = await response.json();
        
        if (result.success) {
          setCategories(result.result || []);
        } else {
          toast.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to fetch categories');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [isClient]);

  // Build stable numbering for Dashboard Image notices (earliest = 1)
  useEffect(() => {
    if (!notices || notices.length === 0) {
      setDashboardImageOrderMap({});
      return;
    }
    const dashboardImageNotices = notices.filter(n =>
      typeof n.title === 'string' && n.title.startsWith('Dashboard Image')
    );
    const sorted = [...dashboardImageNotices].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
      return aTime - bTime; // earliest first
    });
    const map: Record<string, number> = {};
    sorted.forEach((n, idx) => {
      if (n.id) map[n.id] = idx + 1;
    });
    setDashboardImageOrderMap(map);
  }, [notices]);

  // Get unique categories from fetched categories for filter dropdown (type-aware)
  const categoryOptions = [
    "all",
    ...getVisibleCategories().map(getCategoryOptionLabel)
  ];
  
  // Calculate counts for each category label (respecting selected type)
  const getCategoryCount = (categoryLabel: string) => {
    if (categoryLabel === "all") {
      return notices.filter(n => n.title && n.title.trim() !== '' && (selectedCategoryType === "all" || n.categoryType === selectedCategoryType)).length;
    }
    const categoryObj = categories.find(cat => getCategoryOptionLabel(cat) === categoryLabel);
    if (!categoryObj) return 0;
    return notices.filter(n => n.title && n.title.trim() !== '' && n.categoryId === categoryObj.id).length;
  };
  
  // Get unique category types from notices for filter dropdown
  const categoryTypeOptions = ["all", "TEXT", "IMAGE", "PDF"];
  
  // Calculate counts for each category type
  const getCategoryTypeCount = (type: string) => {
    if (type === "all") {
      return notices.filter(notice => notice.title && notice.title.trim() !== '').length;
    }
    return notices.filter(notice => 
      notice.title && notice.title.trim() !== '' && notice.categoryType === type
    ).length;
  };
  
  // Ensure selectedCategory stays valid when type changes
  useEffect(() => {
    if (selectedCategory === "all") return;
    const visibleLabels = getVisibleCategories().map(getCategoryOptionLabel);
    if (!visibleLabels.includes(selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [selectedCategoryType, categories]);

  // Filter notices based on selected category, category type, and search term
  const filteredNotices = notices
    .filter(notice => notice.title && notice.title.trim() !== '')
    .filter(notice => {
      if (selectedCategory === "all") return true;
      // Resolve selected label back to category
      const categoryObj = categories.find(cat => getCategoryOptionLabel(cat) === selectedCategory);
      if (!categoryObj) return false;
      return notice.categoryId === categoryObj.id;
    })
    .filter(notice => {
      // Special handling for TEXT filter - exclude any notices with image data
      if (selectedCategoryType === "TEXT") {
        // If filtering by TEXT, exclude notices that have image data
        if (notice.imageData || notice.imageFileName || notice.imageUrl) {
          console.log(`Excluding image notice "${notice.title}" from TEXT filter`);
          return false;
        }
      }
      
      // Special handling for IMAGE filter - only show notices with image data
      if (selectedCategoryType === "IMAGE") {
        // If filtering by IMAGE, only show notices that have image data
        if (!notice.imageData && !notice.imageFileName && !notice.imageUrl) {
          console.log(`Excluding non-image notice "${notice.title}" from IMAGE filter`);
          return false;
        }
      }
      
      // Special handling for PDF filter - only show notices with PDF data
      if (selectedCategoryType === "PDF") {
        // If filtering by PDF, only show notices that have PDF data
        if (!notice.pdfData && !notice.pdfFileName && !notice.pdfUrl) {
          console.log(`Excluding non-PDF notice "${notice.title}" from PDF filter`);
          return false;
        }
      }
      
      return selectedCategoryType === "all" || notice.categoryType === selectedCategoryType;
    })
    .filter(notice => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = notice.title.toLowerCase().includes(searchLower);
      // Find the category name for search
      const categoryObj = categories.find(cat => cat.id === notice.categoryId);
      const categoryName = categoryObj ? (categoryObj.editedName || categoryObj.name) : '';
      const categoryMatch = categoryName && categoryName.toLowerCase().includes(searchLower);
      const contentMatch = notice.content && notice.content.toLowerCase().includes(searchLower);
      
      return titleMatch || categoryMatch || contentMatch;
    });
  
  // Calculate pagination
  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalPages = Math.ceil(filteredNotices.length / noticesPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedCategoryType("all");
    setSearchTerm("");
    setShowSearch(false);
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedCategory !== "all" || selectedCategoryType !== "all" || searchTerm.trim() !== "";

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
        content: editingNotice.content,
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
            content: updateData.content,
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

  // Handle clear all notices
  const handleClearAll = async () => {
    // Determine what to delete based on selected category
    const isAllCategories = selectedCategory === "all";
    const categoryToDelete = isAllCategories ? "all categories" : selectedCategory;
    const noticesToDelete = isAllCategories ? notices.length : filteredNotices.length;
    
    if (!confirm(`Are you sure you want to delete ALL ${noticesToDelete} notices from "${categoryToDelete}"? This action cannot be undone and will permanently remove these notices.`)) {
      return;
    }

    try {
      setClearingAll(true);
      
      let result;
      if (isAllCategories) {
        // Delete all notices
        result = await deleteAllNotices();
      } else {
        // Delete notices by category
        result = await deleteNoticesByCategory(selectedCategory);
      }
      
      if (result.success) {
        // Update the notices list by removing the deleted notices
        if (isAllCategories) {
          setNotices([]);
        } else {
          // Find the category by name to get its ID
        const categoryObj = categories.find(cat => (cat.editedName || cat.name) === selectedCategory);
        if (categoryObj) {
          setNotices(prev => prev.filter(notice => notice.categoryId !== categoryObj.id));
        }
        }
        setCurrentPage(1);
        toast.success(`Successfully deleted ${noticesToDelete} notices from "${categoryToDelete}"`);
      } else {
        toast.error('Failed to delete notices');
      }
    } catch (error) {
      console.error('Error deleting notices:', error);
      toast.error('Error deleting notices');
    } finally {
      setClearingAll(false);
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

  // Handle content modal for USER role
  const openContentModal = (notice: TNotice) => {
    setSelectedContent({
      title: notice.title,
      content: notice.content || '',
                category: (() => {
            const categoryObj = categories.find(cat => cat.id === notice.categoryId);
            return categoryObj ? (categoryObj.editedName || categoryObj.name) : 'Uncategorized';
          })()
    });
    setContentModalOpen(true);
  };

  const closeContentModal = () => {
    setContentModalOpen(false);
    setSelectedContent(null);
  };

  // Handle image modal for all roles
  const openImageModal = (notice: TNotice) => {
    if (notice.imageData) {
      setSelectedImageContent({
        title: notice.title,
        imageData: notice.imageData,
        fileName: notice.imageFileName || 'Image'
      });
      setImageModalOpen(true);
    }
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageContent(null);
  };

  // Handle PDF modal for all roles
  const openPdfModal = (notice: TNotice) => {
    if (notice.pdfData) {
      setSelectedPdfContent({
        title: notice.title,
        pdfData: notice.pdfData,
        fileName: notice.pdfFileName || 'PDF'
      });
      setPdfModalOpen(true);
    }
  };

  const closePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPdfContent(null);
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

    // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isClient || loading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
          <div className="w-full bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg transition-all duration-300 pb-20">
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
        
        <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
          {/* Category filter dropdown */}
          <div className="relative w-full md:w-40">
            <div 
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 font-medium">
                  {selectedCategory === "all" ? "Categories" : selectedCategory}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-48 overflow-auto">
                {categoryOptions.map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <div 
                      key={category}
                      className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-center justify-between text-sm ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="truncate">
                        {category === "all" ? "All Categories" : category}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Category Type filter dropdown */}
          <div className="relative w-full md:w-36">
            <div 
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm"
              onClick={() => setShowCategoryTypeDropdown(!showCategoryTypeDropdown)}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 font-medium">
                  {selectedCategoryType === "all" ? "Types" : selectedCategoryType}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showCategoryTypeDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            {showCategoryTypeDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-48 overflow-auto">
                {categoryTypeOptions.map((categoryType) => {
                  const isSelected = selectedCategoryType === categoryType;
                  return (
                    <div 
                      key={categoryType}
                      className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-center justify-between text-sm ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      onClick={() => {
                        setSelectedCategoryType(categoryType);
                        setShowCategoryTypeDropdown(false);
                      }}
                    >
                      <span className="truncate">
                        {categoryType === "all" ? "All Types" : categoryType}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Search bar */}
          <div className="relative w-full md:w-40">
            {showSearch ? (
              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 text-sm outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchTerm("");
                  }}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-600 rounded-lg px-3 py-2 transition-all duration-200 text-sm font-medium"
              >
                <Search className="h-4 w-4 mr-2" />
                <span>Search</span>
              </button>
            )}
          </div>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full md:w-auto flex items-center justify-center bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-600 rounded-lg px-3 py-2 transition-all duration-200 text-sm font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              <span>Clear</span>
            </button>
          )}

          {/* Delete All button */}
          {userRole !== 'USER' && filteredNotices.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearingAll}
              className="w-full md:w-auto flex items-center justify-center bg-white border border-red-200 hover:border-red-300 hover:shadow-sm text-red-600 rounded-lg px-3 py-2 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearingAll ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg p-10 border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">No notices found in the database</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg p-10 border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                                  <p className="text-gray-600 text-lg font-medium">
              {searchTerm
                ? "No notices match your search"
                : selectedCategory === "all" && selectedCategoryType === "all"
                  ? "No notices found" 
                  : selectedCategory !== "all" && selectedCategoryType === "all"
                    ? `No notices found in the "${selectedCategory}" category`
                    : selectedCategory === "all" && selectedCategoryType !== "all"
                      ? `No notices found with type "${selectedCategoryType}"`
                      : `No notices found in "${selectedCategory}" with type "${selectedCategoryType}"`}
            </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl shadow-md border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                                 <thead>
                   <tr className="bg-white border-b border-gray-200">
                     <th className="py-3 px-6 text-left font-medium tracking-wider text-gray-700">Notice Title</th>
                     {userRole !== 'USER' && (
                       <th className="py-3 px-6 text-center font-medium tracking-wider w-32 text-gray-700">Actions</th>
                     )}
                   </tr>
                 </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentNotices.map((notice, index) => (
                    <tr 
                      key={notice.id || index} 
                      className="bg-white hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">
                            {(() => {
                              const isDashboardImage = typeof notice.title === 'string' && notice.title.startsWith('Dashboard Image');
                              if (isDashboardImage) {
                                const num = dashboardImageOrderMap[notice.id];
                                return `Dashboard Image - ${num ?? ''}`;
                              }
                              return notice.title;
                            })()}
                          </span>
                          
                          {/* Content for all roles - inline with title */}
                          <div className="mt-2">
                            {notice.content && !notice.imageData && !notice.pdfData ? (
                              <button
                                onClick={() => openContentModal(notice)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-150 flex items-center gap-1"
                              >
                                <span>See more</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            ) : notice.content ? (
                              <span className="text-gray-500 text-sm italic">Content available (view in edit mode)</span>
                            ) : !notice.imageData && !notice.pdfData ? (
                              <span className="text-gray-500 text-sm italic">No content available</span>
                            ) : null}
                          </div>
                          {/* Image controls */}
                          {notice.imageData && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Image Attachment</span>
                                <span className="text-xs text-gray-500">{notice.imageFileName || 'Image'}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openImageModal(notice)}
                                  className="flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Show Preview
                                </button>
                                <button
                                  onClick={() => handleDownload(notice)}
                                  className="flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors font-medium"
                                >
                                  <Download className="w-4 h-4 mr-1.5" />
                                  Download
                                </button>
                              </div>
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
                                  onClick={() => openPdfModal(notice)}
                                  className="flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Show Preview
                                </button>
                                <button
                                  onClick={() => handlePdfDownload(notice)}
                                  className="flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors font-medium"
                                >
                                  <Download className="w-4 h-4 mr-1.5" />
                                  Download
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {userRole !== 'USER' && (
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
                        )}
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

      {/* Professional Pagination Footer */}
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex justify-center items-center py-6 px-6">
            <div className="flex items-center space-x-4">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                title="Previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-2">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  const isActive = currentPage === pageNumber;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform scale-105'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                title="Next page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Page Information */}
              {filteredNotices.length > 0 && (
                <div className="ml-8 flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-px h-6 bg-gray-300"></div>
                  <span className="font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>
                    {filteredNotices.length} total
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {editModalOpen && editingNotice && userRole !== 'USER' && (
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
                     {(() => {
                  const categoryObj = categories.find(cat => cat.id === editingNotice.categoryId);
                  return categoryObj ? (categoryObj.editedName || categoryObj.name) : 'Uncategorized';
                })()}
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
                
                {/* Notice Content - Show only when no image or PDF data */}
                {(!editingNotice.imageData && !editingNotice.pdfData) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notice Content
                    </label>
                    <div className="space-y-4">
                      <div
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white text-gray-900 min-h-[150px]"
                        contentEditable
                        dangerouslySetInnerHTML={{ __html: editingNotice.content || '' }}
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement;
                          setEditingNotice({...editingNotice, content: target.innerHTML || ''});
                        }}
                        onBlur={(e) => {
                          const target = e.target as HTMLDivElement;
                          setEditingNotice({...editingNotice, content: target.innerHTML || ''});
                        }}
                        style={{
                          fontFamily: "Inter, system-ui, sans-serif",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      />
                    </div>
                  </div>
                )}
                
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
                    
                    {/* PDF Upload - Show only when pdfData is not empty */}
                    {editingNotice.pdfData && (
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

      {/* Content Modal for All Roles */}
      {contentModalOpen && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedContent.title}</h3>
                  <p className="text-sm text-indigo-100">Category: {selectedContent.category}</p>
                </div>
              </div>
              <button 
                onClick={closeContentModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="prose prose-lg max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div 
                    className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-xl">
              <button
                onClick={closeContentModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal for All Roles */}
      {imageModalOpen && selectedImageContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedImageContent.title}</h3>
                  <p className="text-sm text-indigo-100">File: {selectedImageContent.fileName}</p>
                </div>
              </div>
              <button 
                onClick={closeImageModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow flex items-center justify-center">
              <div className="max-w-full max-h-full">
                <img
                  src={`data:image/jpeg;base64,${selectedImageContent.imageData}`}
                  alt={selectedImageContent.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-xl">
              <button
                onClick={closeImageModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal for All Roles */}
      {pdfModalOpen && selectedPdfContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPdfContent.title}</h3>
                  <p className="text-sm text-indigo-100">File: {selectedPdfContent.fileName}</p>
                </div>
              </div>
              <button 
                onClick={closePdfModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-150"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="w-full h-full">
                <iframe
                  src={`data:application/pdf;base64,${selectedPdfContent.pdfData}`}
                  className="w-full h-full min-h-[600px] border border-gray-200 rounded-lg"
                  title="PDF Preview"
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-xl">
              <button
                onClick={closePdfModal}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}