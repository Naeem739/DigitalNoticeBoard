'use client'

import { cn } from "@/lib/utils"

// Bell Ringing Loader - Perfect for Smart Notice Board
export function BellLoader({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    default: "w-8 h-8",
    lg: "w-12 h-12"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 animate-ping">
          <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4V5.5C17.6 6.2 20.5 9.1 21.2 12.7C21.3 13.3 20.8 13.8 20.2 13.8H3.8C3.2 13.8 2.7 13.3 2.8 12.7C3.5 9.1 6.4 6.2 10 5.5V4C10 2.9 10.9 2 12 2Z"/>
            <path d="M9 15.5C9 16.9 10.1 18 11.5 18H12.5C13.9 18 15 16.9 15 15.5V14H9V15.5Z"/>
          </svg>
        </div>
        <div className="relative animate-bounce">
          <svg className="w-full h-full text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4V5.5C17.6 6.2 20.5 9.1 21.2 12.7C21.3 13.3 20.8 13.8 20.2 13.8H3.8C3.2 13.8 2.7 13.3 2.8 12.7C3.5 9.1 6.4 6.2 10 5.5V4C10 2.9 10.9 2 12 2Z"/>
            <path d="M9 15.5C9 16.9 10.1 18 11.5 18H12.5C13.9 18 15 16.9 15 15.5V14H9V15.5Z"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// Notice Board Loading Animation
export function NoticeBoardLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative w-16 h-16">
        {/* Board Frame */}
        <div className="absolute inset-0 border-4 border-gray-300 rounded-lg bg-gray-100"></div>
        
        {/* Animated Notice Cards */}
        <div className="absolute inset-2 space-y-1">
          <div className="h-2 bg-yellow-400 rounded animate-pulse"></div>
          <div className="h-2 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-2 bg-green-400 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        {/* Pins */}
        <div className="absolute top-1 left-2 w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
        <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
      <div className="text-sm text-gray-600 font-medium">Loading Notice Board...</div>
    </div>
  )
}

// Dashboard Interface Loader
export function DashboardLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative w-20 h-16">
        {/* Grid Layout */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-400 to-purple-500 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
        
        {/* Loading Indicator */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 font-medium">Loading Dashboard Interface...</div>
    </div>
  )
}

// Content Loading Skeleton
export function ContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
    </div>
  )
}

// Widget Loading Skeleton
export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)}>
      {/* Header */}
      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
      
      {/* Content */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-3/5 animate-pulse"></div>
      </div>
    </div>
  )
}

// Spinning Bell Loader
export function SpinningBellLoader({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    default: "w-8 h-8",
    lg: "w-12 h-12"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg 
        className={cn("text-yellow-500 animate-spin", sizeClasses[size])} 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12 2C13.1 2 14 2.9 14 4V5.5C17.6 6.2 20.5 9.1 21.2 12.7C21.3 13.3 20.8 13.8 20.2 13.8H3.8C3.2 13.8 2.7 13.3 2.8 12.7C3.5 9.1 6.4 6.2 10 5.5V4C10 2.9 10.9 2 12 2Z"/>
        <path d="M9 15.5C9 16.9 10.1 18 11.5 18H12.5C13.9 18 15 16.9 15 15.5V14H9V15.5Z"/>
      </svg>
    </div>
  )
}

// Pulse Dots Loader
export function PulseDotsLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        ></div>
      ))}
    </div>
  )
}

// Wave Loader
export function WaveLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center space-x-1", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 h-8 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        ></div>
      ))}
    </div>
  )
}

// Page Loading Overlay
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
        <BellLoader size="lg" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Inline Loading Spinner
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
      <span className="ml-2 text-sm text-gray-600">Loading...</span>
    </div>
  )
}

// Notice Editor Loader
export function NoticeEditorLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative w-20 h-16">
        {/* Paper/Notice Animation */}
        <div className="absolute inset-0 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
          {/* Animated lines representing text */}
          <div className="absolute inset-2 space-y-1">
            <div className="h-1 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-1 bg-gray-300 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-1 bg-gray-300 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-1 bg-gray-300 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="h-1 bg-gray-300 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          
          {/* Pen icon */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full animate-bounce"></div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute -top-4 left-2 w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -bottom-2 right-4 w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
      </div>
      <div className="text-sm text-gray-600 font-medium">Preparing Notice Editor...</div>
    </div>
  )
} 