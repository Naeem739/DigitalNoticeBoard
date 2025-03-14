'use client'
import { TDashboard } from '@/types/types';
import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
// import type { TDashboard } from '../types';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';


export  const Dashboard = ({ data }:{data:TDashboard | null}) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
    // Calculate aspect ratio (default to 4:3 if null)
    const [widthRatio, heightRatio] = data?.aspectRatio?.split(':').map(Number) || [4, 3];
    
    useEffect(() => {
      const updateDimensions = () => {
        // Use the window width instead of container width for larger dimensions
        const viewportHeight = window.innerHeight - 50; // Reduced padding for more space
        const viewportWidth = window.innerWidth - 50 ; // Account for some minimal padding
        // const scale = widthRatio/heightRatio;
  
        // Calculate dimensions that maintain aspect ratio and fit viewport
        const heightFromWidth = (viewportWidth * heightRatio) / widthRatio;
        const widthFromHeight = (viewportHeight * widthRatio) / heightRatio;
  
        if (heightFromWidth <= viewportHeight) {
          // Width is the limiting factor
          setDimensions({
            width: viewportWidth,
            height: heightFromWidth
          });
        } else {
          // Height is the limiting factor
          setDimensions({
            width: widthFromHeight,
            height: viewportHeight
          });
        }
      };
  
      // Initial calculation
      updateDimensions();
  
      // Update on window resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }, [widthRatio, heightRatio]);
  
    // Convert containers to layout items
    const layout = data?.containers.map(container => ({
      i: container.id,
      x: container.x,
      y: container.y,
      w: (container.w * (widthRatio/heightRatio)),
      h: container.h * (widthRatio/heightRatio),
      static: true 
    }));
  
    // Calculate row height based on available height and maximum grid height
    const maxGridHeight = layout? Math.max(...layout.map(item => item.h)): 100;
    // const maxGridHeight = layout? Math.max(...layout.map(item => item.y + item.h)): 100;
    // const maxGridHeight = 100;
    const rowHeight = dimensions.height / (maxGridHeight);
  
    return (
      <div className="grid-container border  border-lime-500 w-full h-[90vh] ">
        <div 
          className="relative  bg-gray-100 rounded-lg shadow-lg overflow-hidden  h-full border border-red-600 mx-auto   "
          // style={{
          //   width: dimensions.width,
          //   height: dimensions.height,
          //   margin: '0 auto'
          // }}
        >
          {dimensions.width > 0 && (
            <GridLayout
              className="layout border border-sky-500 pb-10 "
              layout={layout}
              cols={6}
              rowHeight={rowHeight}
              width={dimensions.width}
              // rowHeight={rowHeight}
              // width={dimensions.width}
               margin={[20, 20]} // Increased margins
             // containerPadding={[20, 20]} // Increased padding
              style={{
                height: dimensions.height
              }}
            >
              {data?.containers.map((container) => (
                <div
                  key={container.id}
                  style={{
                    width: container.width,
                    // height: container.height
                  }}
                  className="bg-white rounded-md shadow-md p-6 transition-all duration-200 hover:shadow-lg overflow-auto"
                >
                  {container.title && (
                    <h3 className="text-xl font-semibold mb-3 truncate">
                      {container.title}
                      <p> {container.width }</p><p>  {container.height}  </p> 
                    </h3>
                  )}
                  {container.category && (
                    <span className="inline-block px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-full">
                      {container.category}
                    </span>
                  )}
                  {container.noticeIds && (
                    <div className="mt-3 text-sm text-gray-600 truncate">
                      Notice ID: {container.noticeIds}
                    </div>
                  )}
                </div>
              ))}
            </GridLayout>
          )}
        </div>
      </div>
    );
  }
