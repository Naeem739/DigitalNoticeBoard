"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/types";
import { getCategories } from "@/app/actions/category.action";
import { toast } from "sonner";
import { 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  Palette, 
  Save, 
  Upload, 
  FileText, 
  X, 
  Eye,
  Bell,
  AlertCircle,
} from "lucide-react";
import { NoticeEditorLoader } from "@/components/ui/loader";

export default function NoticeEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState("14");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contentMode, setContentMode] = useState<'text' | 'pdf' | 'image'>('text');
  
  // Track active formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Font size options
  const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36];
  
  // Color options for text and background
  const colorOptions = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#DC2626" },
    { name: "Blue", value: "#2563EB" },
    { name: "Green", value: "#059669" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Purple", value: "#7C3AED" },
    { name: "Orange", value: "#EA580C" },
    { name: "Gray", value: "#6B7280" },
    { name: "White", value: "#FFFFFF" },
    { name: "Teal", value: "#0D9488" },
    { name: "Pink", value: "#EC4899" },
  ];

  // Function to filter categories based on content mode
  const filterCategoriesByMode = (mode: 'text' | 'pdf' | 'image') => {
    const categoryTypeMap = {
      'text': 'TEXT',
      'pdf': 'PDF',
      'image': 'IMAGE'
    };
    
    const targetType = categoryTypeMap[mode];
    // Filter by category type AND exclude the "Dashboard" and "Default" categories
    const filtered = categories.filter(category => 
      category.categoryType === targetType && 
      category.name.toLowerCase() !== 'dashboard' &&
      !category.name.toLowerCase().startsWith('default')
    );
    setFilteredCategories(filtered);
    
    // Reset selected category if it's not in the filtered list
    if (selectedCategory && !filtered.find(cat => cat.name === selectedCategory)) {
      setSelectedCategory("");
    }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const categories = await getCategories();
        if (categories.success) {
          setCategories(categories.result as []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    getData();
    
    // Initialize editor
    const editor = document.getElementById("richTextEditor");
    if (editor) {
      editor.style.fontFamily = "Inter, system-ui, sans-serif";
      editor.style.fontSize = "14px";
    }
    
    // Add event listener to track selection changes
    document.addEventListener("selectionchange", checkFormatting);
    
    return () => {
      document.removeEventListener("selectionchange", checkFormatting);
    };
  }, []);

  // Filter categories when content mode changes
  useEffect(() => {
    if (categories.length > 0) {
      filterCategoriesByMode(contentMode);
    }
  }, [contentMode, categories]);
  
  // Function to check current formatting state
  const checkFormatting = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveNotice();
  };

  // Handle PDF file upload
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please select a valid PDF file");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("PDF file size must be less than 10MB");
        return;
      }

      setPdfFile(file);
      setPdfFileName(file.name);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success("PDF uploaded successfully!");
    }
  };

  // Remove PDF file
  const removePdfFile = () => {
    setPdfFile(null);
    setPdfPreview(null);
    setPdfFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("PDF removed");
  };

  // Handle image file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Image file size must be less than 10MB");
        return;
      }

      setImageFile(file);
      setImageFileName(file.name);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success("Image uploaded successfully!");
    }
  };

  // Remove image file
  const removeImageFile = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageFileName("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    toast.success("Image removed");
  };

  // Convert PDF to base64
  const convertPdfToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Convert image to base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Save notice function
  const saveNotice = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (contentMode === 'text' && (!content.trim() || content === '<br>' || content === '<div><br></div>')) {
      toast.error("Please enter content in the text editor");
      return;
    }
    
    if (contentMode === 'pdf' && !pdfFile) {
      toast.error("Please upload a PDF document");
      return;
    }
    
    if (contentMode === 'image' && !imageFile) {
      toast.error("Please upload an image");
      return;
    }
    
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsSaving(true);

    console.log("Available categories:", filteredCategories.map(c => ({ id: c.id, name: c.name })));
    console.log("Selected category:", selectedCategory);
    
    const specificCategory = filteredCategories.filter(category => 
      category.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    
    console.log("Found category:", specificCategory);

    if (!specificCategory.length) {
      toast.error("Selected category not found");
      setIsSaving(false);
      return;
    }

    try {
      let pdfData = null;
      let imageData = null;
      
      if (pdfFile) {
        pdfData = await convertPdfToBase64(pdfFile);
      }
      
      if (imageFile) {
        imageData = await convertImageToBase64(imageFile);
        // Don't set imageUrl here - let the server action upload to Supabase and set it
      }

      const data = {
        title: title.trim(),
        content: content,
        category: selectedCategory,
        categoryId: specificCategory[0].id!,
        pdfData: pdfData || undefined,
        pdfFileName: pdfFileName,
        imageData: imageData || undefined,
        imageUrl: undefined, // Let server-side logic upload to Supabase and set the URL
        imageFileName: imageFileName,
        createdAt: new Date()
      };

      console.log("Sending data to server (API):", data);

      const response = await fetch("/api/notice/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const newNotice = await response.json();

      if (response.ok && newNotice.success) {
        toast.success("Notice created successfully!");
        setTitle("");
        setContent("");
        setSelectedCategory("");
        setPdfFile(null);
        setPdfPreview(null);
        setPdfFileName("");
        setImageFile(null);
        setImagePreview(null);
        setImageFileName("");
        
        // Reset editor content
        const editor = document.getElementById("richTextEditor");
        if (editor) {
          editor.innerHTML = "";
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      } else {
        toast.error(
          typeof newNotice.message === "string"
            ? newNotice.message
            : "Failed to save notice"
        );
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error("Failed to save notice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to execute basic formatting commands
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    const editor = document.getElementById("richTextEditor");
    if (editor) {
      editor.focus();
    }
    checkFormatting();
  };

  // Font color change handler
  const changeFontColor = (color: string) => {
    formatText('foreColor', color);
  };

  // Background color change handler
  const changeBackgroundColor = (color: string) => {
    formatText('hiliteColor', color);
  };

  // Apply formatting
  const applyFormatting = (command: string) => {
    formatText(command);
  };

  // Handle editor input
  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    checkFormatting();
    const target = e.target as HTMLDivElement;
    // Store HTML content to preserve formatting and newlines
    setContent(target.innerHTML || '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center">
        <NoticeEditorLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Create New Notice</h1>
                <p className="text-gray-600 mt-1">Design and publish your notice with rich formatting and PDF support</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category 
                    <span className="text-xs text-gray-500 ml-2">
                      ({contentMode === 'text' ? 'Text' : contentMode === 'pdf' ? 'PDF' : 'Image'} categories only)
                    </span>
                  </label>
            <Select
              onValueChange={(value: string) => setSelectedCategory(value)}
              value={selectedCategory}
            >
                    <SelectTrigger className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-yellow-400 transition-all focus:border-yellow-500">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No {contentMode === 'text' ? 'Text' : contentMode === 'pdf' ? 'PDF' : 'Image'} categories available
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notice Title</label>
            <Input
              type="text"
                    placeholder="Enter a compelling title for your notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
                    className="text-lg border-2 border-gray-200 rounded-lg hover:border-yellow-400 transition-all focus:border-yellow-500 bg-gray-50"
              required
            />
          </div>
        </div>

              {/* Content Mode Toggle */}
              <div className="border-t pt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Content Type</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setContentMode('text');
                      setSelectedCategory(""); // Reset category when mode changes
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      contentMode === 'text'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Type className="w-4 h-4 inline mr-2" />
                    Rich Text Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentMode('pdf');
                      setSelectedCategory(""); // Reset category when mode changes
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      contentMode === 'pdf'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    PDF Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentMode('image');
                      setSelectedCategory(""); // Reset category when mode changes
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      contentMode === 'image'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Image Upload
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* PDF Upload Card */}
          {contentMode === 'pdf' && (
            <Card className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  PDF Document Upload
                </h2>
              </div>
              
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-yellow-400 transition-all">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  
                  {!pdfFile ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload PDF Document</h3>
                        <p className="text-gray-500 mb-4">Drag and drop your PDF file here, or click to browse</p>
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose PDF File
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400">
                        Maximum file size: 10MB • Supported format: PDF
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <FileText className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">PDF Uploaded Successfully</h3>
                        <p className="text-gray-600 mb-2">{pdfFileName}</p>
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPdfPreview(!showPdfPreview)}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {showPdfPreview ? 'Hide Preview' : 'Preview PDF'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={removePdfFile}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* PDF Preview */}
                {showPdfPreview && pdfPreview && (
                  <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700">PDF Preview</h4>
                    </div>
                    <div className="h-[600px] overflow-auto">
                      <iframe
                        src={pdfPreview}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Image Upload Card */}
          {contentMode === 'image' && (
            <Card className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Image Upload
                </h2>
              </div>
              
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-yellow-400 transition-all">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {!imageFile ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Upload className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Image</h3>
                        <p className="text-gray-500 mb-4">Drag and drop your image file here, or click to browse</p>
                        <Button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image File
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400">
                        Maximum file size: 10MB • Supported formats: JPG, PNG, GIF, WebP
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Upload className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Image Uploaded Successfully</h3>
                        <p className="text-gray-600 mb-2">{imageFileName}</p>
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowImagePreview(!showImagePreview)}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {showImagePreview ? 'Hide Preview' : 'Preview Image'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={removeImageFile}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Image Preview */}
                {showImagePreview && imagePreview && (
                  <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700">Image Preview</h4>
                    </div>
                    <div className="p-4">
                      <img
                        src={imagePreview}
                        alt="Image Preview"
                        className="max-w-full h-auto max-h-[400px] mx-auto rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Rich Text Editor Card */}
          {contentMode === 'text' && (
            <Card className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Rich Text Content
                </h2>
              </div>
            
            <div className="overflow-hidden">
          {/* Formatting Toolbar */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b p-4 flex flex-wrap gap-3 items-center">
                <div className="flex items-center bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <button 
                type="button" 
                onClick={() => applyFormatting('bold')}
                    className={`p-3 hover:bg-gray-100 transition-colors ${isBold ? 'bg-blue-100 text-blue-700' : ''}`}
                title="Bold"
              >
                <Bold size={18} />
              </button>
                  <div className="h-8 w-px bg-gray-200"></div>
                <button 
                  type="button" 
                  onClick={() => applyFormatting('italic')}
                    className={`p-3 hover:bg-gray-100 transition-colors ${isItalic ? 'bg-blue-100 text-blue-700' : ''}`}
                title="Italic"
              >
                <Italic size={18} />
              </button>
                  <div className="h-8 w-px bg-gray-200"></div>
                <button 
                  type="button" 
                  onClick={() => applyFormatting('underline')}
                    className={`p-3 hover:bg-gray-100 transition-colors ${isUnderline ? 'bg-blue-100 text-blue-700' : ''}`}
                title="Underline"
              >
                <Underline size={18} />
              </button>
            </div>
            
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center px-3">
                    <Type size={16} className="text-gray-500 mr-2" />
                <Select 
                  value={fontSize}
                      onValueChange={(value) => setFontSize(value)}
                >
                      <SelectTrigger className="w-20 border-0 p-2 h-10">
                        <SelectValue>{fontSize}px</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {fontSizes.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center px-3">
                    <Palette size={16} className="text-gray-500 mr-2" />
                <Select onValueChange={(value) => changeFontColor(value)}>
                      <SelectTrigger className="w-28 border-0 p-2 h-10">
                        <SelectValue placeholder="Text Color">Text Color</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 mr-2 rounded-full border border-gray-300" 
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center px-3">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-sm mr-2"></div>
                <Select onValueChange={(value) => changeBackgroundColor(value)}>
                      <SelectTrigger className="w-32 border-0 p-2 h-10">
                        <SelectValue placeholder="Background">Background</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 mr-2 rounded-sm border border-gray-300" 
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Rich Text Editor */}
          <div
            id="richTextEditor"
            contentEditable
            onInput={handleEditorInput}
            onBlur={(e) => setContent(e.currentTarget.innerHTML || '')}
            onFocus={checkFormatting}
            onKeyUp={checkFormatting}
            onMouseUp={checkFormatting}
            className="w-full min-h-[400px] p-6 focus:outline-none overflow-auto bg-white"
            style={{ 
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "14px",
              lineHeight: "1.6"
            }}
          />
            </div>
        </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Toggle between Rich Text Editor, PDF Upload, and Image Upload to add content</span>
            </div>
            
            <div className="flex gap-4">
            
          <Button 
            type="submit" 
                disabled={isSaving || !title.trim() || !selectedCategory || 
                  (contentMode === 'text' && (!content.trim() || content === '<br>' || content === '<div><br></div>')) || 
                  (contentMode === 'pdf' && !pdfFile) ||
                  (contentMode === 'image' && !imageFile)}
                className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-8 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg relative overflow-hidden ${isSaving ? 'animate-pulse' : ''}`}
          >
            {isSaving ? (
              <>
                {/* Professional Loading Animation */}
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-yellow-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <span className="font-medium">Publishing Notice...</span>
                {/* Progress Dots */}
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Publish Notice</span>
              </>
            )}
            {/* Shimmer Effect */}
            {isSaving && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDuration: '2s' }}></div>
            )}
          </Button>
            </div>
        </div>
      </form>
      </div>
    </div>
  );
}