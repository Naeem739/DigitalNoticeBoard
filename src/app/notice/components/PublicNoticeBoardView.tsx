/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { TDashboard } from '@/types/types';
import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Client-only wrapper for GridLayout to prevent hydration issues
const ClientOnlyGridLayout = ({ children, ...props }: any) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="grid-container border border-lime-500 w-full h-[90vh]">
        <div className="relative bg-gray-100 rounded-lg shadow-lg overflow-hidden h-full border border-red-600 mx-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  // Cast GridLayout to any to bypass type conflicts
  const GridLayoutComponent = GridLayout as any;
  return <GridLayoutComponent {...props}>{children}</GridLayoutComponent>;
};

export const Dashboard = ({ data }:{data:TDashboard | null}) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isClient, setIsClient] = useState(false);
  
    // Calculate aspect ratio (default to 4:3 if null)
    const [widthRatio, heightRatio] = data?.aspectRatio?.split(':').map(Number) || [4, 3];
    
    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (!isClient) return;
      
      const updateDimensions = () => {
        // Use the window width instead of container width for larger dimensions
        const viewportHeight = window.innerHeight - 50; // Reduced padding for more space
        const viewportWidth = window.innerWidth - 50 ; // Account for some minimal padding
  
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
    }, [widthRatio, heightRatio, isClient]);
  
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
    const rowHeight = dimensions.height / (maxGridHeight);
  
    if (!isClient) {
      return (
        <div className="grid-container border border-lime-500 w-full h-[90vh]">
          <div className="relative bg-gray-100 rounded-lg shadow-lg overflow-hidden h-full border border-red-600 mx-auto flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid-container border  border-lime-500 w-full h-[90vh] ">
        <div 
          className="relative  bg-gray-100 rounded-lg shadow-lg overflow-hidden  h-full border border-red-600 mx-auto   "
        >
          {dimensions.width > 0 && (
            <ClientOnlyGridLayout
              className="layout border border-sky-500 pb-10 "
              layout={layout}
              cols={6}
              rowHeight={rowHeight}
              width={dimensions.width}
              margin={[20, 20]}
              style={{
                height: dimensions.height
              }}
            >
              {data?.containers.map((container) => {
                // Find the original container data to access settings
                return (
                  <div
                    key={container.id}
                    style={{
                      width: container.width,
                    }}
                    className="bg-white rounded-md shadow-md p-6 transition-all duration-200 hover:shadow-lg overflow-auto"
                  >
                    {container.title && (
                      <h3 className="text-xl font-semibold mb-3 truncate">
                        {(container as any).settings?.customCategoryName || container.title}
                        <p> {container.width }</p><p>  {container.height}  </p> 
                      </h3>
                    )}
                  </div>
                );
              })}
            </ClientOnlyGridLayout>
          )}
        </div>
      </div>
    );
  }