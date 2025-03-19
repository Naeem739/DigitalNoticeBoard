/*              ** Ashik er Code *** 


"use client";
import React, { useEffect, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Plus, X, ChevronDown } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./edit-dashboard.css";
import { AspectRatio, TNotice, Widget } from "@/types/types";
import { getCategoriesWithNotices } from "@/app/actions/category.action";
import { createDashboard } from "@/app/actions/dashboard.action";
import { toast } from "sonner";

type TCategoriesWithNotices = {
  id: string;
  name: string;
  notices: TNotice[];
};

type TResult = {
  success: boolean;
  result: TCategoriesWithNotices[];
};

// const categories = [
//   {
//     id: "dlfdfaf"
//     name: 'Analytics',
//     notices: [
//                    {
//                       id:"afdafafa",
//                       title:"a;dfas",
//                       content:" dfajdfadfa",
//                       category: "a;dsfkaf"
//                    }
//              ]
//    },
//    ....
//
// ];

const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> =
  {
    "4:3": { width: 800, height: 600 },
    "16:9": { width: 960, height: 540 },
    "16:10": { width: 960, height: 600 },
  };

function EditDashboardDemo() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<TCategoriesWithNotices | null>(null);
  const [categories, setCategories] = useState<TCategoriesWithNotices[]>([]);

  useEffect(() => {
    const getData = async () => {
      const categoriesWithNotices =
        (await getCategoriesWithNotices()) as TResult;
      if (categoriesWithNotices.success) {
        console.log(categoriesWithNotices);
        setCategories(categoriesWithNotices.result as TCategoriesWithNotices[]);
      }
    };

    getData();
  }, []);

  const addWidget = () => {
    if (!selectedRatio) return;

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      title: `Notice ${widgets.length + 1}`,
    };

    const newLayout: Layout = {
      i: newWidget.id,
      x: (layout.length * 2) % 6,
      y: Infinity,
      w: 2,
      h: 2,
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayout]);
  };

  const removeWidget = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedWidgets = widgets.filter((widget) => widget.id !== id);
    const updatedLayout = layout.filter((item) => item.i !== id);
    setWidgets(updatedWidgets);
    setLayout(updatedLayout);
  };

  const handleRatioSelect = (ratio: AspectRatio) => {
    setSelectedRatio(ratio);
    setIsRatioDropdownOpen(false);
    setWidgets([]);
    setLayout([]);
  };

  const handleCategorySelect = (category: TCategoriesWithNotices) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, title: string) => {
    e.dataTransfer.setData("text/plain", title);
  };

  const handleDrop = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    const title = e.dataTransfer.getData("text/plain");
    const notice = selectedCategory?.notices.filter(
      (notice) => notice.title === title
    )[0];
    setWidgets(
      widgets.map((widget) =>
        widget.id === widgetId
          ? {
              ...widget,
              content: title,
              noticeId: notice?.id,
              category: selectedCategory?.name,
            }
          : widget
      )
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const calculateDimensionsPercentage = (widgetLayout: Layout) => {
    if (!selectedRatio) return { width: "0%", height: "0%" };

    const containerWidth = RATIO_DIMENSIONS[selectedRatio].width - 32; // Accounting for container padding
    const containerHeight = RATIO_DIMENSIONS[selectedRatio].height;

    const colWidth = (containerWidth - 5 * 12 * 2) / 6; // Subtracting margins (5 gaps * 12px * 2 sides)
    const rowHeight = 100; // Fixed row height

    const widgetWidth =
      ((widgetLayout.w * colWidth + (widgetLayout.w - 1) * 24) /
        containerWidth) *
      100;
    const widgetHeight =
      ((widgetLayout.h * rowHeight + (widgetLayout.h - 1) * 24) /
        containerHeight) *
      100;

    return {
      width: `${widgetWidth.toFixed(1)}%`,
      height: `${widgetHeight.toFixed(1)}%`,
    };
  };

  const handleSave = async () => {


    const dashboard = {
      aspectRatio: selectedRatio,
      containers: [...positions],
    };

    try {
      const result = await createDashboard(dashboard);
      if (result.success) {
        return toast("Dashboard Created Successfully!");
      } else {
        return toast("Something went wrong!");
      }
    } catch (error) {
      toast(`${error}`);
    }
  };


  const calculatePercentagePositions = () => {

    const containers = widgets.map((widget) => {
      const specificLayout = layout.filter((item) => widget.id === item.i)[0];
      // const {width, height} = calculateDimensionsPercentage(specificLayout);

      const containerWidth = RATIO_DIMENSIONS["4:3"].width - 32; // Accounting for container padding
      const containerHeight = RATIO_DIMENSIONS["4:3"].height;

      const colWidth = (containerWidth - 5 * 12 * 2) / 6; // Subtracting margins (5 gaps * 12px * 2 sides)
      const rowHeight = 100; // Fixed row height from the original code

      const leftPx = specificLayout.x * (colWidth + 24); // x position * (column width + margin)
      const topPx = specificLayout.y * (rowHeight + 24); // y position * (row height + margin)

      // Convert positions to percentages of container dimensions
      const leftPercent = (leftPx / containerWidth) * 100;
      const topPercent = (topPx / containerHeight) * 100;

      // Calculate dimensions as percentages (as in the original code)
      const widgetWidth =
        ((specificLayout.w * colWidth + (specificLayout.w - 1) * 24) /
          containerWidth) *
        100;
      const widgetHeight =
        ((specificLayout.h * rowHeight + (specificLayout.h - 1) * 24) /
          containerHeight) *
        100;

      return {
        id: specificLayout.i,
        x: specificLayout.x,
        y: specificLayout.y,
        w: specificLayout.w,
        h: specificLayout.h,
        leftPx: `${leftPx.toFixed(1)}px`,
        topPx: `${topPx.toFixed(1)}px`,
        leftPercent: `${leftPercent.toFixed(2)}%`,
        topPercent: `${topPercent.toFixed(2)}%`,
        width: `${widgetWidth.toFixed(2)}%`,
        height: `${widgetHeight.toFixed(2)}%`,
        title: widget.content,
        category: selectedCategory?.name,
        noticeId: widget.noticeId,
      };
    });


    return containers;
  };

  //   const containerWidth = RATIO_DIMENSIONS['4:3'].width - 32 // Accounting for container padding
  //   const containerHeight = RATIO_DIMENSIONS['4:3'].height

  //   const colWidth = (containerWidth - 5 * 12 * 2) / 6 // Subtracting margins (5 gaps * 12px * 2 sides)
  //   const rowHeight = 100 // Fixed row height from the original code

  //   return layout.map((item) => {
  //     // Calculate absolute position (top, left) in pixels
  //     const leftPx = item.x * (colWidth + 24) // x position * (column width + margin)
  //     const topPx = item.y * (rowHeight + 24) // y position * (row height + margin)

  //     // Convert positions to percentages of container dimensions
  //     const leftPercent = (leftPx / containerWidth) * 100
  //     const topPercent = (topPx / containerHeight) * 100

  //     // Calculate dimensions as percentages (as in the original code)
  //     const widgetWidth = ((item.w * colWidth + (item.w - 1) * 24) / containerWidth) * 100
  //     const widgetHeight = ((item.h * rowHeight + (item.h - 1) * 24) / containerHeight) * 100

  //     return {
  //       id: item.i,
  //       x: item.x,
  //       y: item.y,
  //       w: item.w,
  //       h: item.h,
  //       leftPx: `${leftPx.toFixed(1)}px`,
  //       topPx: `${topPx.toFixed(1)}px`,
  //       leftPercent: `${leftPercent.toFixed(2)}%`,
  //       topPercent: `${topPercent.toFixed(2)}%`,
  //       width: `${widgetWidth.toFixed(2)}%`,
  //       height: `${widgetHeight.toFixed(2)}%`,
  //     }
  //   })
  // }

  const positions = calculatePercentagePositions();
  console.log(positions);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex gap-4">
        <div className="relative">
          <button
            onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 flex items-center gap-2"
          >
            Select Display {selectedRatio ? `(${selectedRatio})` : ""}{" "}
            <ChevronDown size={16} />
          </button>
          {isRatioDropdownOpen && (
            <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              {(["4:3", "16:9", "16:10"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleRatioSelect(ratio)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={addWidget}
          disabled={!selectedRatio}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            selectedRatio
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus size={20} /> Create Widget
        </button>
        <div className="relative">
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
          >
            Category {selectedCategory ? `(${selectedCategory.name})` : ""}{" "}
            <ChevronDown size={16} />
          </button>
          {isCategoryDropdownOpen && (
            <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 min-w-[200px]">
              {categories.map((category) => (
                <button
                  key={category.name    }
                  onClick={() => handleCategorySelect(category)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCategory && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Draggable Titles:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCategory.notices.map((notice) => (
              <div
                key={notice.id}
                draggable
                onDragStart={(e) => handleDragStart(e, notice.title)}
                className="bg-gray-100 px-3 py-1 rounded cursor-move hover:bg-gray-200 transition-colors"
              >
                {notice.title}
                
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRatio && (
        <div
          className="border-4 border-dashed border-gray-300 rounded-lg mx-auto overflow-hidden"
          style={{
            width: RATIO_DIMENSIONS[selectedRatio].width,
            height: RATIO_DIMENSIONS[selectedRatio].height,
          }}
        >
          <GridLayout
            className="layout"
            layout={layout}
            cols={6}
            rowHeight={100}
            width={RATIO_DIMENSIONS[selectedRatio].width - 32}
            onLayoutChange={(newLayout) => setLayout(newLayout)}
            margin={[12, 12]}
            draggableHandle=".widget-drag-handle"
          >
            {widgets.map((widget) => {
              const widgetLayout = layout.find((l) => l.i === widget.id);
              const dimensions = widgetLayout
                ? calculateDimensionsPercentage(widgetLayout)
                : { width: "0%", height: "0%" };
              console.log(widget);

              return (
                <div
                  key={widget.id}
                  className="bg-white rounded-lg shadow-md relative"
                  onDrop={(e) => handleDrop(e, widget.id)}
                  onDragOver={handleDragOver}
                >
                  <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md z-50">
                    {dimensions.width} × {dimensions.height}
                  </div>
                  <div className="widget-drag-handle cursor-move p-4">
                    <h3 className="text-lg font-semibold text-center">
                      {widget.title}
                    </h3>
                    {widget.content ? (
                      <div className="mt-4 text-center">
                        <p className="text-xl font-bold text-gray-700">
                          {widget.content}
                        </p>
                        <span className="text-xs  text-green-500 p-1 rounded">
                          {widget.category}
                        </span>
                        
                      </div>
                    ) : (
                      <div className="mt-4 text-center text-gray-400">
                        <p>Drag a title here</p>
                        {}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => removeWidget(e, widget.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-50"
                  >
                    <X size={20} className="text-red-500" />
                  </button>
                </div>
              );
            })}
          </GridLayout>
        </div>
      )}
      {selectedRatio && (
        <div className="w-full border flex justify-end">
          <button onClick={handleSave}>Save</button>
        </div>
      )}
    </div>
  );
}

export default EditDashboardDemo;

              
*/
// Naeem er Code 

"use client";
import React, { useEffect, useState, useRef } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Plus, X, ChevronDown, Settings, Palette, Type, ListFilter, Layers, GripVertical } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./edit-dashboard.css";
import { AspectRatio, TNotice, Widget } from "@/types/types";
import { getCategoriesWithNotices } from "@/app/actions/category.action";
import { createDashboard } from "@/app/actions/dashboard.action";
import { toast } from "sonner";

type TCategoriesWithNotices = {
  id: string;
  name: string;
  notices: TNotice[];
};

type TResult = {
  success: boolean;
  result: TCategoriesWithNotices[];
};

type WidgetSettings = {
  backgroundColor: string;
  backgroundOpacity: number;
  cardOpacity: number;
  borderColor: string;
  borderWidth: number;
  fontColor: string;
  noticeCount: number;
};

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  backgroundColor: "#ffffff",
  backgroundOpacity: 0.3,
  cardOpacity: 0.9,
  borderColor: "#e2e8f0",
  borderWidth: 1,
  fontColor: "#1e293b",
  noticeCount: 3
};

const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "4:3": { width: 800, height: 600 },
  "16:9": { width: 960, height: 540 },
  "16:10": { width: 960, height: 600 },
};

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function EditDashboardDemo() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<TCategoriesWithNotices[]>([]);
  const [activeSettingsWidget, setActiveSettingsWidget] = useState<string | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<Record<string, WidgetSettings>>({});
  
  // New state for draggable settings panel
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getData = async () => {
      const categoriesWithNotices = (await getCategoriesWithNotices()) as TResult;
      if (categoriesWithNotices.success) {
        setCategories(categoriesWithNotices.result as TCategoriesWithNotices[]);
      }
    };

    getData();
  }, []);

  // Add event handlers for dragging the settings panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = settingsPosition.x + (e.clientX - startPosition.x);
      const newY = settingsPosition.y + (e.clientY - startPosition.y);
      
      setSettingsPosition({ x: newX, y: newY });
      setStartPosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPosition, settingsPosition]);
  
  // Reset settings position when opening for a new widget
  useEffect(() => {
    if (activeSettingsWidget && settingsRef.current) {
      // Position it near the current widget but ensure it's visible
      const widgetElement = document.getElementById(activeSettingsWidget);
      if (widgetElement) {
        const rect = widgetElement.getBoundingClientRect();
        setSettingsPosition({ 
          x: Math.min(rect.right, window.innerWidth - 300), 
          y: Math.max(rect.top, 100)
        });
      } else {
        // Default position if widget not found
        setSettingsPosition({ x: window.innerWidth / 2 - 150, y: 100 });
      }
    }
  }, [activeSettingsWidget]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const addWidget = () => {
    if (!selectedRatio) return;

    const newWidgetId = `widget-${Date.now()}`;
    const newWidget: Widget = {
      id: newWidgetId,
      title: `Widget ${widgets.length + 1}`,
    };

    const newLayout: Layout = {
      i: newWidget.id,
      x: (layout.length * 2) % 6,
      y: Infinity,
      w: 2,
      h: 2,
    };

    // Initialize settings for this widget
    setWidgetSettings(prev => ({
      ...prev,
      [newWidgetId]: { ...DEFAULT_WIDGET_SETTINGS }
    }));

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayout]);
    
    toast.success("Widget added successfully!");
  };

  const removeWidget = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updatedWidgets = widgets.filter((widget) => widget.id !== id);
    const updatedLayout = layout.filter((item) => item.i !== id);
    
    // Also remove settings for this widget
    const updatedSettings = { ...widgetSettings };
    delete updatedSettings[id];
    
    setWidgets(updatedWidgets);
    setLayout(updatedLayout);
    setWidgetSettings(updatedSettings);
    setActiveSettingsWidget(null);
    
    toast.success("Widget removed");
  };

  const handleRatioSelect = (ratio: AspectRatio) => {
    setSelectedRatio(ratio);
    setIsRatioDropdownOpen(false);
    setWidgets([]);
    setLayout([]);
    setWidgetSettings({});
    toast(`Display ratio set to ${ratio}`);
  };

  const handleDragStart2 = (e: React.DragEvent, category: TCategoriesWithNotices) => {
    e.dataTransfer.setData("categoryId", category.id);
    e.dataTransfer.setData("categoryName", category.name);
  };

  const handleDrop = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    const categoryId = e.dataTransfer.getData("categoryId");
    const categoryName = e.dataTransfer.getData("categoryName");
    
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Get top N notices from the category based on widget settings
    const noticeCount = widgetSettings[widgetId]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount;
    const topNotices = [...category.notices].slice(0, noticeCount);

    setWidgets(
      widgets.map((widget) =>
        widget.id === widgetId
          ? {
              ...widget,
              content: categoryName,
              categoryId: categoryId,
              category: categoryName,
              notices: category.notices,
              topNotices: topNotices,
            }
          : widget
      )
    );
    
    toast.success(`Added ${categoryName} to widget`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const calculateDimensionsPercentage = (widgetLayout: Layout) => {
    if (!selectedRatio) return { width: "0%", height: "0%" };

    const containerWidth = RATIO_DIMENSIONS[selectedRatio].width - 32;
    const containerHeight = RATIO_DIMENSIONS[selectedRatio].height;

    const colWidth = (containerWidth - 5 * 12 * 2) / 6;
    const rowHeight = 100;

    const widgetWidth =
      ((widgetLayout.w * colWidth + (widgetLayout.w - 1) * 24) /
        containerWidth) *
      100;
    const widgetHeight =
      ((widgetLayout.h * rowHeight + (widgetLayout.h - 1) * 24) /
        containerHeight) *
      100;

    return {
      width: `${widgetWidth.toFixed(1)}%`,
      height: `${widgetHeight.toFixed(1)}%`,
    };
  };

  const handleSave = async () => {
    const positions = calculatePercentagePositions();
    const dashboard = {
      aspectRatio: selectedRatio,
      containers: [...positions],
    };

    try {
      const result = await createDashboard(dashboard);
      if (result.success) {
        toast.success("Dashboard Created Successfully!");
      } else {
        toast.error("Something went wrong!");
      }
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const calculatePercentagePositions = () => {
    const containers = widgets.map((widget) => {
      const specificLayout = layout.filter((item) => widget.id === item.i)[0];
      if (!specificLayout) return null;

      const containerWidth = RATIO_DIMENSIONS[selectedRatio || "4:3"].width - 32;
      const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height;

      const colWidth = (containerWidth - 5 * 12 * 2) / 6;
      const rowHeight = 100;

      const leftPx = specificLayout.x * (colWidth + 24);
      const topPx = specificLayout.y * (rowHeight + 24);

      const leftPercent = (leftPx / containerWidth) * 100;
      const topPercent = (topPx / containerHeight) * 100;

      const widgetWidth =
        ((specificLayout.w * colWidth + (specificLayout.w - 1) * 24) /
          containerWidth) *
        100;
      const widgetHeight =
        ((specificLayout.h * rowHeight + (specificLayout.h - 1) * 24) /
          containerHeight) *
        100;

      const settings = widgetSettings[widget.id] || DEFAULT_WIDGET_SETTINGS;
      
      // Select relevant notice IDs from the top notices
      const noticeIds = widget.topNotices 
        ? widget.topNotices.map(notice => notice.id) 
        : [];

      return {
        id: specificLayout.i,
        x: specificLayout.x,
        y: specificLayout.y,
        w: specificLayout.w,
        h: specificLayout.h,
        leftPx: `${leftPx.toFixed(1)}px`,
        topPx: `${topPx.toFixed(1)}px`,
        leftPercent: `${leftPercent.toFixed(2)}%`,
        topPercent: `${topPercent.toFixed(2)}%`,
        width: `${widgetWidth.toFixed(2)}%`,
        height: `${widgetHeight.toFixed(2)}%`,
        title: widget.content || widget.title,
        category: widget.category,
        noticeIds: noticeIds,
        settings: settings
      };
    }).filter(Boolean);

    return containers;
  };

  const toggleWidgetSettings = (widgetId: string) => {
    if (activeSettingsWidget === widgetId) {
      setActiveSettingsWidget(null);
    } else {
      setActiveSettingsWidget(widgetId);
    }
  };

  const updateWidgetSetting = (widgetId: string, setting: keyof WidgetSettings, value: any) => {
    setWidgetSettings(prev => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        [setting]: value
      }
    }));
    
    // If this is a notice count change and the widget has a category, update topNotices
    if (setting === 'noticeCount') {
      const widget = widgets.find(w => w.id === widgetId);
      if (widget && widget.notices) {
        const topNotices = [...widget.notices].slice(0, value);
        setWidgets(
          widgets.map((w) =>
            w.id === widgetId
              ? {
                  ...w,
                  topNotices: topNotices,
                }
              : w
          )
        );
      }
    }
  };

  const getPresetColors = () => [
    "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", 
    "#cbd5e1", "#94a3b8", "#64748b", "#1e293b",
    "#ef4444", "#f97316", "#eab308", "#10b981", 
    "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef"
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative">
          <button
            onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 transition-all shadow hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              Select Display {selectedRatio ? `(${selectedRatio})` : ""}
              <ChevronDown size={16} />
            </span>
          </button>
          {isRatioDropdownOpen && (
            <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              {(["4:3", "16:9", "16:10"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleRatioSelect(ratio)}
                  className="block w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors"
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={addWidget}
          disabled={!selectedRatio}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ${
            selectedRatio
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus size={20} /> Create Widget
        </button>
        
        <button
          onClick={handleSave}
          disabled={!selectedRatio || widgets.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shadow hover:shadow-md ml-auto ${
            selectedRatio && widgets.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Save Dashboard
        </button>
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Draggable Categories:</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart2(e, category)}
              className="bg-indigo-50 px-3 py-1 rounded-md cursor-move hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              {category.name} ({category.notices.length} notices)
            </div>
          ))}
        </div>
      </div>

      {selectedRatio && (
        <div
          className="border-4 border-dashed border-gray-300 rounded-lg mx-auto overflow-hidden bg-white p-4"
          style={{
            width: RATIO_DIMENSIONS[selectedRatio].width,
            height: RATIO_DIMENSIONS[selectedRatio].height,
          }}
        >
          <GridLayout
            className="layout"
            layout={layout}
            cols={6}
            rowHeight={100}
            width={RATIO_DIMENSIONS[selectedRatio].width - 32}
            onLayoutChange={(newLayout) => setLayout(newLayout)}
            margin={[12, 12]}
            draggableHandle=".widget-drag-handle"
          >
            {widgets.map((widget) => {
              const widgetLayout = layout.find((l) => l.i === widget.id);
              const dimensions = widgetLayout
                ? calculateDimensionsPercentage(widgetLayout)
                : { width: "0%", height: "0%" };
              const settings = widgetSettings[widget.id] || DEFAULT_WIDGET_SETTINGS;
              
              // Generate background color with opacity
              const bgColor = hexToRgba(settings.backgroundColor, settings.backgroundOpacity);
              const cardBgColor = hexToRgba(settings.backgroundColor, settings.cardOpacity);

              return (
                <div
                  id={widget.id}
                  key={widget.id}
                  className="rounded-lg shadow-md relative"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: settings.borderColor,
                    borderWidth: `${settings.borderWidth}px`,
                    borderStyle: 'solid',
                    transition: 'all 0.2s ease'
                  }}
                  onDrop={(e) => handleDrop(e, widget.id)}
                  onDragOver={handleDragOver}
                >
                  <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md z-10">
                    {dimensions.width} × {dimensions.height}
                  </div>
                  
                  <div className="absolute top-2 right-10 z-10">
                    <button
                      onClick={() => toggleWidgetSettings(widget.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Settings size={20} className="text-gray-600" />
                    </button>
                  </div>
                  
                  <button
                    onClick={(e) => removeWidget(e, widget.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                  >
                    <X size={20} className="text-red-500" />
                  </button>
                  
                  <div className="widget-drag-handle cursor-move p-4 overflow-auto h-full">
                    <h3 
                      className="text-lg font-semibold text-center mb-2"
                      style={{ color: settings.fontColor }}
                    >
                      {widget.content || widget.title}
                    </h3>
                    {widget.topNotices ? (
                      <div className="mt-2">
                        <div className="bg-indigo-50 py-1 px-2 rounded mb-2 text-center">
                          <span className="text-sm font-medium text-indigo-600">
                            Top {widget.topNotices.length} Notices
                          </span>
                        </div>
                        <div className="space-y-2">
                          {widget.topNotices.map((notice) => (
                            <div 
                              key={notice.id} 
                              className="rounded shadow p-2"
                              style={{
                                backgroundColor: cardBgColor,
                                borderLeft: `3px solid ${settings.borderColor}`
                              }}
                            >
                              <p 
                                className="text-sm font-medium"
                                style={{ color: settings.fontColor }}
                              >
                                {notice.title}
                              </p>
                              {notice.content && (
                                <p 
                                  className="text-xs truncate mt-1"
                                  style={{ color: settings.fontColor, opacity: 0.7 }}
                                >
                                  {notice.content.substring(0, 50)}
                                  {notice.content.length > 50 ? "..." : ""}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {widget.notices && (
                          <p 
                            className="text-xs mt-2 text-right"
                            style={{ color: settings.fontColor, opacity: 0.6 }}
                          >
                            Total: {widget.notices.length} notices
                          </p>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="mt-4 text-center flex items-center justify-center h-16 border-2 border-dashed rounded-lg"
                        style={{ borderColor: settings.fontColor, opacity: 0.4 }}
                      >
                        <p style={{ color: settings.fontColor }}>Drag a category here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </GridLayout>
        </div>
      )}
      
      {/* Draggable Settings Modal */}
      {activeSettingsWidget && (
        <div 
          ref={settingsRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 w-64 max-h-screen overflow-y-auto"
          style={{ 
            left: `${settingsPosition.x}px`, 
            top: `${settingsPosition.y}px` 
          }}
        >
          <div 
            className="flex items-center justify-between mb-3 cursor-move bg-gray-50 rounded-md p-2"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-gray-400" />
              <h4 className="font-medium text-sm">Widget Settings</h4>
            </div>
            <button
              onClick={() => setActiveSettingsWidget(null)}
              className="hover:bg-gray-200 rounded-full p-1 transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Palette size={14} /> Background Color
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {getPresetColors().map(color => (
                <button
                  key={color}
                  onClick={() => updateWidgetSetting(activeSettingsWidget, 'backgroundColor', color)}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ 
                    backgroundColor: color,
                    outline: widgetSettings[activeSettingsWidget]?.backgroundColor === color ? '2px solid #3b82f6' : 'none'
                  }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={widgetSettings[activeSettingsWidget]?.backgroundColor || DEFAULT_WIDGET_SETTINGS.backgroundColor}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'backgroundColor', e.target.value)}
                className="w-6 h-6 p-0 rounded-full ml-1"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Layers size={14} /> Background Opacity
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={widgetSettings[activeSettingsWidget]?.backgroundOpacity || DEFAULT_WIDGET_SETTINGS.backgroundOpacity}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'backgroundOpacity', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                {Math.round((widgetSettings[activeSettingsWidget]?.backgroundOpacity || DEFAULT_WIDGET_SETTINGS.backgroundOpacity) * 100)}%
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Layers size={14} /> Card Opacity
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={widgetSettings[activeSettingsWidget]?.cardOpacity || DEFAULT_WIDGET_SETTINGS.cardOpacity}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'cardOpacity', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                {Math.round((widgetSettings[activeSettingsWidget]?.cardOpacity || DEFAULT_WIDGET_SETTINGS.cardOpacity) * 100)}%
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Palette size={14} /> Border Color
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {getPresetColors().map(color => (
                <button
                  key={color}
                  onClick={() => updateWidgetSetting(activeSettingsWidget, 'borderColor', color)}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ 
                    backgroundColor: color,
                    outline: widgetSettings[activeSettingsWidget]?.borderColor === color ? '2px solid #3b82f6' : 'none'
                  }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={widgetSettings[activeSettingsWidget]?.borderColor || DEFAULT_WIDGET_SETTINGS.borderColor}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'borderColor', e.target.value)}
                className="w-6 h-6 p-0 rounded-full ml-1"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Type size={14} /> Font Color
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {getPresetColors().map(color => (
                <button
                  key={color}
                  onClick={() => updateWidgetSetting(activeSettingsWidget, 'fontColor', color)}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ 
                    backgroundColor: color,
                    outline: widgetSettings[activeSettingsWidget]?.fontColor === color ? '2px solid #3b82f6' : 'none'
                  }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={widgetSettings[activeSettingsWidget]?.fontColor || DEFAULT_WIDGET_SETTINGS.fontColor}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'fontColor', e.target.value)}
                className="w-6 h-6 p-0 rounded-full ml-1"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <ListFilter size={14} /> Number of Notices
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="1"
                max="10"
                value={widgetSettings[activeSettingsWidget]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'noticeCount', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                {widgetSettings[activeSettingsWidget]?.noticeCount || DEFAULT_WIDGET_SETTINGS.noticeCount}
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-xs text-gray-500">Border Width</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="0"
                max="5"
                value={widgetSettings[activeSettingsWidget]?.borderWidth || DEFAULT_WIDGET_SETTINGS.borderWidth}
                onChange={(e) => updateWidgetSetting(activeSettingsWidget, 'borderWidth', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                {widgetSettings[activeSettingsWidget]?.borderWidth || DEFAULT_WIDGET_SETTINGS.borderWidth}px
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditDashboardDemo;