"use client";

import { useEffect, useState } from "react";
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
import { createNotice } from "@/app/actions/notice.action";
import { getCategoriesWithNotices } from "@/app/actions/category.action";
import { toast } from "sonner";
import { PenLine, Type, Bold, Italic, Underline, Palette, Save, ChevronDown } from "lucide-react";

export default function NoticeEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fontSize, setFontSize] = useState("12");
  
  // Track active formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Font size options (7pt to 48pt)
  const fontSizes = [7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48];
  
  // Common colors for text and background
  const colorOptions = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Green", value: "#008000" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Purple", value: "#800080" },
    { name: "Orange", value: "#FFA500" },
    { name: "Gray", value: "#808080" },
    { name: "White", value: "#FFFFFF" },
    { name: "Teal", value: "#008080" },
    { name: "Pink", value: "#FFC0CB" },
  ];

  useEffect(() => {
    const getData = async () => {
      try {
        const categories = await getCategoriesWithNotices();
        if (categories.success) {
          console.log(categories);
          setCategories(categories.result as []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      }
    };

    getData();
    
    // Initialize editor with Times New Roman
    const editor = document.getElementById("richTextEditor");
    if (editor) {
      editor.style.fontFamily = "Times New Roman, serif";
      editor.style.fontSize = "12pt";
    }
    
    // Add event listener to track selection changes
    document.addEventListener("selectionchange", checkFormatting);
    
    return () => {
      document.removeEventListener("selectionchange", checkFormatting);
    };
  }, []);
  
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

  // New function to save notice for reusability
  const saveNotice = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }
    
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsSaving(true);

    const specificCategory = categories.filter(category => category.name === selectedCategory);
    console.log("Selected category:", specificCategory);

    if (!specificCategory.length) {
      toast.error("Selected category not found");
      setIsSaving(false);
      return;
    }

    const data = {
      title: title.trim(),
      content: content,
      category: selectedCategory,
      categoryId: specificCategory[0].id!,
      createdAt: new Date().toISOString() 
    };
    
    try {
      const newNotice = await createNotice(data);
      console.log("Create notice response:", newNotice);

      if (newNotice.success) {
        toast.success("Notice created successfully!");
        setTitle("");
        setContent("");
        setSelectedCategory("");
        
        // Reset editor content
        const editor = document.getElementById("richTextEditor");
        if (editor) {
          editor.innerHTML = "";
        }
      } else {
        toast.error(newNotice.message || "Failed to save notice");
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
    
    // Update formatting state after applying command
    checkFormatting();
  };

  // Function to change font size - updated to only apply to new text
  const changeFontSize = (size: string) => {
    setFontSize(size);
    
    // Set a data attribute on the editor to store current font size
    const editor = document.getElementById("richTextEditor");
    if (editor) {
      editor.dataset.currentFontSize = size;
      editor.focus();
      
      // Only apply the font size to a selection if one exists
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        // Apply font size to selected text
        document.execCommand("fontSize", false, "7"); // Placeholder size
        
        // Find all font elements with size=7 and replace with span + style
        const fonts = editor.querySelectorAll("font[size='7']");
        fonts.forEach(font => {
          const span = document.createElement("span");
          span.style.fontSize = `${size}pt`;
          span.style.fontFamily = "Times New Roman, serif";
          
          // Move children from font to span
          while (font.firstChild) {
            span.appendChild(font.firstChild);
          }
          
          // Replace font with span
          font.parentNode?.replaceChild(span, font);
        });
      }
    }
  };

  // Font color change handler
  const changeFontColor = (color: string) => {
    formatText('foreColor', color);
    ensureTimesNewRoman();
  };

  // Background color change handler
  const changeBackgroundColor = (color: string) => {
    formatText('hiliteColor', color);
    ensureTimesNewRoman();
  };

  // Ensure Times New Roman is applied after formatting
  const ensureTimesNewRoman = () => {
    setTimeout(() => {
      const editor = document.getElementById("richTextEditor");
      if (editor) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const span = document.createElement("span");
          span.style.fontFamily = "Times New Roman, serif";
          range.surroundContents(span);
        }
      }
    }, 0);
  };

  // Apply bold, italic, underline with Times New Roman preservation
  const applyFormatting = (command: string) => {
    formatText(command);
    ensureTimesNewRoman();
  };
  
  // Handle paste event to maintain formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Insert text with current formatting
    document.execCommand('insertText', false, text);
  };
  
  // Handle key press to implement font size for new text
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Skip for special keys like backspace, delete, arrows, etc.
    if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }
  };
  
  // Handle input event to apply font size to newly inserted text
  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    checkFormatting();
    
    const target = e.target as HTMLDivElement;
    setContent(target.innerHTML);
    
    // Handle font sizing for newly inserted text
    const editor = document.getElementById("richTextEditor");
    if (editor && editor.dataset.currentFontSize) {
      const currentSize = editor.dataset.currentFontSize;
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Get the text node where cursor is
        const currentNode = range.startContainer;
        
        // Only process text nodes that were just modified
        if (currentNode.nodeType === Node.TEXT_NODE) {
          // Check if the text node is already inside a formatted span
          let needsFormatting = true;
          let parent = currentNode.parentNode;
          
          // Check if parent already has the correct font size
          if (parent && 
              parent.nodeType === Node.ELEMENT_NODE && 
              (parent as HTMLElement).style && 
              (parent as HTMLElement).style.fontSize === `${currentSize}pt`) {
            needsFormatting = false;
          }
          
          if (needsFormatting) {
            // Create a new range for the last character(s) inserted
            const newRange = document.createRange();
            const newTextLength = currentNode.textContent?.length || 0;
            
            // Check if there's text to format
            if (newTextLength > 0) {
              // Determine how many characters were just inserted (usually 1)
              const charsInserted = 1;
              
              // Position to start applying format (from end of text, backward)
              const startPos = Math.max(0, newTextLength - charsInserted);
              
              newRange.setStart(currentNode, startPos);
              newRange.setEnd(currentNode, newTextLength);
              
              // Apply formatting to the newly typed character(s)
              selection.removeAllRanges();
              selection.addRange(newRange);
              
              // Create a span with the right font size
              const span = document.createElement("span");
              span.style.fontSize = `${currentSize}pt`;
              span.style.fontFamily = "Times New Roman, serif";
              
              // Wrap the selected text
              newRange.surroundContents(span);
              
              // Restore cursor position at end
              selection.removeAllRanges();
              newRange.collapse(false); // collapse to end
              selection.addRange(newRange);
            }
          }
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-xl shadow-lg">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <PenLine className="mr-3" size={28} />
          Notice Editor
        </h1>
        <p className="text-blue-100 mt-2">Create beautifully formatted notices</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-b-xl shadow-lg p-6 space-y-6 border border-t-0 border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select
              onValueChange={(value: string) => setSelectedCategory(value)}
              value={selectedCategory}
            >
              <SelectTrigger className="w-full bg-white border-2 border-gray-300 rounded-md hover:border-blue-500 transition-all">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              type="text"
              placeholder="Enter Notice Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg border-2 border-gray-300 rounded-md hover:border-blue-500 transition-all"
              style={{ fontFamily: "Times New Roman, serif" }}
              required
            />
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-md">
          {/* Formatting Toolbar */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b p-3 flex flex-wrap gap-2 items-center">
            <div className="flex items-center bg-white rounded-md shadow-sm overflow-hidden">
              <button 
                type="button" 
                onClick={() => applyFormatting('bold')}
                className={`p-2 hover:bg-gray-100 transition-colors ${isBold ? 'bg-blue-100 text-blue-700' : ''}`}
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <button 
                type="button" 
                onClick={() => applyFormatting('italic')}
                className={`p-2 hover:bg-gray-100 transition-colors ${isItalic ? 'bg-blue-100 text-blue-700' : ''}`}
                title="Italic"
              >
                <Italic size={18} />
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <button 
                type="button" 
                onClick={() => applyFormatting('underline')}
                className={`p-2 hover:bg-gray-100 transition-colors ${isUnderline ? 'bg-blue-100 text-blue-700' : ''}`}
                title="Underline"
              >
                <Underline size={18} />
              </button>
            </div>
            
            <div className="flex items-center bg-white rounded-md shadow-sm">
              <div className="flex items-center px-2">
                <Type size={16} className="text-gray-500 mr-1" />
                <Select 
                  value={fontSize}
                  onValueChange={(value) => changeFontSize(value)}
                >
                  <SelectTrigger className="w-16 border-0 p-1 h-8" style={{ fontFamily: "Times New Roman, serif" }}>
                    <SelectValue>{fontSize}pt</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {fontSizes.map((size) => (
                        <SelectItem 
                          key={size} 
                          value={size.toString()}
                          style={{ fontFamily: "Times New Roman" }}
                        >
                          {size}pt
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center bg-white rounded-md shadow-sm">
              <div className="flex items-center px-2">
                <Palette size={16} className="text-gray-500 mr-1" />
                <Select onValueChange={(value) => changeFontColor(value)}>
                  <SelectTrigger className="w-24 border-0 p-1 h-8" style={{ fontFamily: "Times New Roman" }}>
                    <SelectValue placeholder="Color">Text</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      {colorOptions.map((color) => (
                        <SelectItem 
                          key={color.value} 
                          value={color.value}
                          style={{ fontFamily: "Times New Roman" }}
                        >
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

            <div className="flex items-center bg-white rounded-md shadow-sm">
              <div className="flex items-center px-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-sm mr-1"></div>
                <Select onValueChange={(value) => changeBackgroundColor(value)}>
                  <SelectTrigger className="w-28 border-0 p-1 h-8" style={{ fontFamily: "Times New Roman" }}>
                    <SelectValue placeholder="Bg Color">Background</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectGroup>
                      {colorOptions.map((color) => (
                        <SelectItem 
                          key={color.value} 
                          value={color.value}
                          style={{ fontFamily: "Times New Roman" }}
                        >
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
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            onBlur={(e) => setContent(e.currentTarget.innerHTML)}
            onFocus={checkFormatting}
            onKeyUp={checkFormatting}
            onMouseUp={checkFormatting}
            className="w-full min-h-[500px] p-6 focus:outline-none overflow-auto"
            style={{ 
              fontFamily: "Times New Roman",
              fontSize: "12pt",
              backgroundColor: "white"
            }}
            data-current-font-size="12"
          />
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSaving || !title.trim() || !content.trim() || !selectedCategory}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? "Saving Notice..." : "Save Notice"}
          </Button>
        </div>
      </form>
      
      <div className="mt-4 text-center text-gray-500 text-sm">
        All notices are saved in Times New Roman font by default
      </div>
    </div>
  );
}