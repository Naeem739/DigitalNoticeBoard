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
      title: `Widget ${widgets.length + 1}`,
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

  const handleDragStart = (e: React.DragEvent, category: TCategoriesWithNotices) => {
    e.dataTransfer.setData("categoryId", category.id);
    e.dataTransfer.setData("categoryName", category.name);
  };

  const handleDrop = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    const categoryId = e.dataTransfer.getData("categoryId");
    const categoryName = e.dataTransfer.getData("categoryName");
    
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Get top 4 notices from the category
    const topNotices = [...category.notices].slice(0, 4);

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
    const positions = calculatePercentagePositions();
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
      if (!specificLayout) return null;

      const containerWidth = RATIO_DIMENSIONS[selectedRatio || "4:3"].width - 32;
      const containerHeight = RATIO_DIMENSIONS[selectedRatio || "4:3"].height;

      const colWidth = (containerWidth - 5 * 12 * 2) / 6; // Subtracting margins (5 gaps * 12px * 2 sides)
      const rowHeight = 100; // Fixed row height from the original code

      const leftPx = specificLayout.x * (colWidth + 24); // x position * (column width + margin)
      const topPx = specificLayout.y * (rowHeight + 24); // y position * (row height + margin)

      // Convert positions to percentages of container dimensions
      const leftPercent = (leftPx / containerWidth) * 100;
      const topPercent = (topPx / containerHeight) * 100;

      // Calculate dimensions as percentages
      const widgetWidth =
        ((specificLayout.w * colWidth + (specificLayout.w - 1) * 24) /
          containerWidth) *
        100;
      const widgetHeight =
        ((specificLayout.h * rowHeight + (specificLayout.h - 1) * 24) /
          containerHeight) *
        100;

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
  
      };
    }).filter(Boolean);

    return containers;
  };

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
      </div>

     
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Draggable Categories:</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category)}
              className="bg-gray-100 px-3 py-1 rounded cursor-move hover:bg-gray-200 transition-colors"
            >
              {category.name} ({category.notices.length} notices)
            </div>
          ))}
        </div>
      </div>

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
                  <div className="widget-drag-handle cursor-move p-4 overflow-auto h-full">
                    <h3 className="text-lg font-semibold text-center mb-2">
                      {widget.content || widget.title}
                    </h3>
                    {widget.topNotices ? (
                      <div className="mt-2">
                        <div className="bg-indigo-50 py-1 px-2 rounded mb-2 text-center">
                          <span className="text-sm font-medium text-indigo-600">
                            Top {widget.topNotices.length} Notices
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {widget.topNotices.map((notice) => (
                            <li 
                              key={notice.id} 
                              className="border-b border-gray-100 pb-1"
                            >
                              <p className="text-sm font-medium">{notice.title}</p>
                              {notice.content && (
                                <p className="text-xs text-gray-500 truncate">
                                  {notice.content.substring(0, 50)}
                                  {notice.content.length > 50 ? "..." : ""}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                        {widget.notices && (
                          <p className="text-xs text-gray-500 mt-2 text-right">
                            Total: {widget.notices.length} notices
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 text-center text-gray-400 flex items-center justify-center h-16">
                        <p>Drag a category here</p>
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
        <div className="w-full mt-4 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Save Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default EditDashboardDemo; 
