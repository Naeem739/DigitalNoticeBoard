

// 'use client'
// import React, { useEffect, useState } from 'react';
// import GridLayout, { Layout } from 'react-grid-layout';
// import { Plus, X, LineChart, ChevronDown } from 'lucide-react';
// import 'react-grid-layout/css/styles.css';
// import 'react-resizable/css/styles.css';
// import './edit-dashboard.css';
// import { AspectRatio, TNotice, Widget } from '@/types/types';
// import { getCategoriesWithNotices } from '@/app/actions/category.action';
// import { createDashboard } from '@/app/actions/dashboard.action';
// import { toast } from 'sonner';
// import EditDashboardDemo from './edit-dashboard-demo';



// type TCategoriesWithNotices = {
//   id: string
//   name: string
//   notices: TNotice[]
// }

// type TResult = {
//   success: boolean
//   result: TCategoriesWithNotices[]
// }

// // const categories = [
// //   {
// //     id: "dlfdfaf"
// //     name: 'Analytics',
// //     notices: [
// //                    {
// //                       id:"afdafafa",
// //                       title:"a;dfas",
// //                       content:" dfajdfadfa",
// //                       category: "a;dsfkaf"
// //                    }
// //              ]
// //    },
// //    ....
// //
// // ];

// const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
//   '4:3': { width: 800, height: 600 },
//   '16:9': { width: 960, height: 540 },
//   '16:10': { width: 960, height: 600 }
// };

// function App() {
//   const [widgets, setWidgets] = useState<Widget[]>([]);
//   const [layout, setLayout] = useState<Layout[]>([]);
//   const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);
//   const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
//   const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState<TCategoriesWithNotices | null>(null);
//   const [categories,setCategories] = useState<TCategoriesWithNotices[]>([]);

//     useEffect(() => {
//       const getData = async () => {
//         const categoriesWithNotices = await getCategoriesWithNotices() as TResult;
//         if (categoriesWithNotices.success) {
//           console.log(categoriesWithNotices);
//           setCategories(categoriesWithNotices.result as TCategoriesWithNotices[]);
//         }
//       };
  
//       getData();
//     }, []);


//   const addWidget = () => {
//     if (!selectedRatio) return;

//     const newWidget: Widget = {
//       id: `widget-${Date.now()}`,
//       title: `Widget ${widgets.length + 1}`,
//     };

//     const newLayout: Layout = {
//       i: newWidget.id,
//       x: (layout.length * 2) % 6,
//       y: Infinity,
//       w: 2,
//       h: 2,
//     };

//     setWidgets([...widgets, newWidget]);
//     setLayout([...layout, newLayout]);
//   };

//   const removeWidget = (e: React.MouseEvent, id: string) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const updatedWidgets = widgets.filter(widget => widget.id !== id);
//     const updatedLayout = layout.filter(item => item.i !== id);
//     setWidgets(updatedWidgets);
//     setLayout(updatedLayout);
//   };

//   const handleRatioSelect = (ratio: AspectRatio) => {
//     setSelectedRatio(ratio);
//     setIsRatioDropdownOpen(false);
//     setWidgets([]);
//     setLayout([]);
//   };

//   const handleCategorySelect = (category: TCategoriesWithNotices) => {
//     setSelectedCategory(category);
//     setIsCategoryDropdownOpen(false);
//   };

//   const handleDragStart = (e: React.DragEvent, title: string) => {
//     e.dataTransfer.setData('text/plain', title);
//   };



//   const handleDrop = (e: React.DragEvent, widgetId: string) => {
//     e.preventDefault();
//     const title = e.dataTransfer.getData('text/plain');
//     const notice = selectedCategory?.notices.filter(notice => notice.title === title )[0] ;
//     setWidgets(widgets.map(widget => 
//       widget.id === widgetId ? { ...widget, content: title, noticeId:notice?.id  } : widget
//     ));
//   };

//   const handleDragOver = (e: React.DragEvent) => { 
//     e.preventDefault();
//   };

//   const calculateDimensionsPercentage = (widgetLayout: Layout) => {
//     if (!selectedRatio) return { width: '0%', height: '0%' };
    
//     const containerWidth = RATIO_DIMENSIONS[selectedRatio].width - 32; // Accounting for container padding
//     const containerHeight = RATIO_DIMENSIONS[selectedRatio].height;
    
//     const colWidth = (containerWidth - (5 * 12 * 2)) / 6; // Subtracting margins (5 gaps * 12px * 2 sides)
//     const rowHeight = 100; // Fixed row height
    
//     const widgetWidth = (widgetLayout.w * colWidth + (widgetLayout.w - 1) * 24) / containerWidth * 100;
//     const widgetHeight = (widgetLayout.h * rowHeight + (widgetLayout.h - 1) * 24) / containerHeight * 100;
    
//     return {
//       width: `${widgetWidth.toFixed(1)}%`,
//       height: `${widgetHeight.toFixed(1)}%`
//     };
//   };


//   const handleSave = async() =>{
//     const containers = widgets.map(widget => {
//           const specificLayout = layout.filter( item => widget.id=== item.i)[0];
//           const {width, height} = calculateDimensionsPercentage(specificLayout);

//           return {
//             i:specificLayout.i,
//             h:specificLayout.h,
//             w:specificLayout.w,
//             x:specificLayout.x,
//             y:specificLayout.y,
//             title:widget.content,
//             id: widget.id,
//             category: selectedCategory?.name,
//             noticeId: widget.noticeId,
//             width,
//             height
//           }
//     })

//     console.log(containers);

//     const dashboard = {
//       aspectRatio: selectedRatio,
//       containers: containers


//     }

//     try{
//       const result =  await createDashboard(dashboard);
//       if(result.success){
//         return toast("Dashboard Created Successfully!");
//       }
//       else{
//         return toast("Something went wrong!");
//       }
//     }
//     catch(error){
//       toast(`${error}`);
//     }

  

//   }

//   return (
//     <div>
//       <EditDashboardDemo></EditDashboardDemo>
//     </div>
//   );
//   // return (
//   //   <div className="min-h-screen bg-gray-100 p-6">
//   //     <div className="mb-6 flex gap-4">
//   //       <div className="relative">
//   //         <button
//   //           onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
//   //           className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 flex items-center gap-2"
//   //         >
//   //           Select Display {selectedRatio ? `(${selectedRatio})` : ''} <ChevronDown size={16} />
//   //         </button>
//   //         {isRatioDropdownOpen && (
//   //           <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10">
//   //             {(['4:3', '16:9', '16:10'] as AspectRatio[]).map((ratio) => (
//   //               <button
//   //                 key={ratio}
//   //                 onClick={() => handleRatioSelect(ratio)}
//   //                 className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//   //               >
//   //                 {ratio}
//   //               </button>
//   //             ))}
//   //           </div>
//   //         )}
//   //       </div>
//   //       <button
//   //         onClick={addWidget}
//   //         disabled={!selectedRatio}
//   //         className={`flex items-center gap-2 px-4 py-2 rounded ${
//   //           selectedRatio
//   //             ? 'bg-blue-500 text-white hover:bg-blue-600'
//   //             : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//   //         }`}
//   //       >
//   //         <Plus size={20} /> Create Widget
//   //       </button>
//   //       <div className="relative">
//   //         <button
//   //           onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
//   //           className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
//   //         >
//   //           Category {selectedCategory ? `(${selectedCategory.name})` : ''} <ChevronDown size={16} />
//   //         </button>
//   //         {isCategoryDropdownOpen && (
//   //           <div className="absolute top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 min-w-[200px]">
//   //             {categories.map((category) => (
//   //               <button
//   //                 key={category.name}
//   //                 onClick={() => handleCategorySelect(category)}
//   //                 className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//   //               >
//   //                 {category.name}
//   //               </button>
//   //             ))}
//   //           </div>
//   //         )}
//   //       </div>
//   //     </div>

//   //     {selectedCategory && (
//   //       <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
//   //         <h3 className="text-lg font-semibold mb-3">Draggable Titles:</h3>
//   //         <div className="flex flex-wrap gap-2">
//   //           {selectedCategory.notices.map((notice) => (
//   //             <div
//   //               key={notice.id}
//   //               draggable
//   //               onDragStart={(e) => handleDragStart(e, notice.title)}
//   //               className="bg-gray-100 px-3 py-1 rounded cursor-move hover:bg-gray-200 transition-colors"
//   //             >
//   //               {notice.title}
//   //             </div>
//   //           ))}
//   //         </div>
//   //       </div>
//   //     )}

//   //     {selectedRatio && (
//   //       <div
//   //         className="border-4 border-dashed border-gray-300 rounded-lg mx-auto overflow-hidden"
//   //         style={{
//   //           width: RATIO_DIMENSIONS[selectedRatio].width,
//   //           height: RATIO_DIMENSIONS[selectedRatio].height,
//   //         }}
//   //       >
//   //         <GridLayout
//   //           className="layout"
//   //           layout={layout}
//   //           cols={6}
//   //           rowHeight={100}
//   //           width={RATIO_DIMENSIONS[selectedRatio].width - 32}
//   //           onLayoutChange={(newLayout) => setLayout(newLayout)}
//   //           margin={[12, 12]}
//   //           draggableHandle=".widget-drag-handle"
//   //         >
//   //           {widgets.map((widget) => {
//   //             const widgetLayout = layout.find(l => l.i === widget.id);
//   //             const dimensions = widgetLayout ? calculateDimensionsPercentage(widgetLayout) : { width: '0%', height: '0%' };
              
//   //             return (
//   //               <div
//   //                 key={widget.id}
//   //                 className="bg-white rounded-lg shadow-md relative"
//   //                 onDrop={(e) => handleDrop(e, widget.id)}
//   //                 onDragOver={handleDragOver}
//   //               >
//   //                 <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md z-50">
//   //                   {dimensions.width} × {dimensions.height}
//   //                 </div>
//   //                 <div className="widget-drag-handle cursor-move p-4">
//   //                   <h3 className="text-lg font-semibold text-center">{widget.title}</h3>
//   //                   {widget.content ? (
//   //                     <div className="mt-4 text-center">
//   //                       <p className="text-xl font-bold text-gray-700">{widget.content}</p>
//   //                       <LineChart className="w-12 h-12 mx-auto mt-2" />
//   //                     </div>
//   //                   ) : (
//   //                     <div className="mt-4 text-center text-gray-400">
//   //                       <p>Drag a title here</p>
//   //                       <LineChart className="w-12 h-12 mx-auto mt-2" />
//   //                     </div>
//   //                   )}
//   //                 </div>
//   //                 <button
//   //                   onClick={(e) => removeWidget(e, widget.id)}
//   //                   className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-50"
//   //                 >
//   //                   <X size={20} className="text-red-500" />
//   //                 </button>
//   //               </div>
//   //             );
//   //           })}
//   //         </GridLayout>
//   //       </div>
//   //     )}
//   //  { selectedRatio &&  <div className='w-full border flex justify-end' >
//   //       <button onClick={handleSave} >Save</button>
//   //     </div>}
//   //   </div>
//   // );
// }

// export default App;