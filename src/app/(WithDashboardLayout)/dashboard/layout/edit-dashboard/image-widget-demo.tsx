"use client"

import React from 'react'
import { ImageIcon, Upload } from 'lucide-react'

// Demo component to showcase the single image widget functionality
const ImageWidgetDemo: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Single Image Widget Demo</h2>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Features</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <ImageIcon size={16} className="text-green-500" />
              Single image per widget
            </li>
            <li className="flex items-center gap-2">
              <Upload size={16} className="text-blue-500" />
              Drag & drop or click to upload
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
              Responsive image sizing - image adapts to widget size
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded-full"></span>
              Easy image replacement
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
              Optional image title overlay
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">How to Use</h3>
          <div className="space-y-3 text-gray-600">
            <p>1. Select a display ratio (4:3, 16:9, or 16:10)</p>
            <p>2. Click "Create Image Widget" button</p>
            <p>3. Drag and drop an image onto the widget or click to upload</p>
            <p>4. Resize the widget - the image will automatically resize with it</p>
            <p>5. Use the settings panel to customize appearance</p>
            <p>6. Replace the image by uploading a new one</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Responsive Image Behavior</h3>
          <div className="space-y-3 text-gray-600">
            <p><strong>Image Fit Options:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• <strong>Cover:</strong> Image fills entire widget, may crop</li>
              <li>• <strong>Contain:</strong> Full image visible, may have empty space</li>
              <li>• <strong>Fill:</strong> Image stretched to fill widget</li>
              <li>• <strong>Scale-down:</strong> Image scaled down if larger than widget</li>
            </ul>
            <p className="mt-3"><strong>Widget Resizing:</strong></p>
            <p>When you resize the widget (drag corners), the image automatically adjusts to the new dimensions while maintaining the selected fit mode.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Customization Options</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium mb-2">Image Display</h4>
              <ul className="space-y-1">
                <li>• Image fit mode</li>
                <li>• Border radius</li>
                <li>• Show/hide image title</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Title Styling</h4>
              <ul className="space-y-1">
                <li>• Title color</li>
                <li>• Font size</li>
                <li>• Font weight</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-2 text-green-800">Key Improvements</h3>
          <ul className="text-green-700 space-y-1">
            <li>• <strong>Single Image:</strong> Only one image per widget for cleaner design</li>
            <li>• <strong>Responsive Sizing:</strong> Image automatically resizes when widget size changes</li>
            <li>• <strong>Full Widget Coverage:</strong> Image fills the entire widget area</li>
            <li>• <strong>Easy Replacement:</strong> Upload new image to replace existing one</li>
            <li>• <strong>Title Overlay:</strong> Optional title displayed over the image</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ImageWidgetDemo 