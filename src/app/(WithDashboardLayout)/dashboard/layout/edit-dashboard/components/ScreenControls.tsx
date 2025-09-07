"use client"

import React from "react"
import { Plus, Trash2, X } from "lucide-react"

type Screen = {
  id: string
  name: string
}

type Props = {
  showScreenControls: boolean
  setShowScreenControls: React.Dispatch<React.SetStateAction<boolean>>
  screens: Screen[]
  currentScreenIndex: number
  setCurrentScreenIndex: (index: number) => void
  addScreen: () => Promise<void> | void
  clearAllScreens: () => Promise<void> | void
  removeScreen: (screenIndex: number) => Promise<void> | void
  isAddingScreen: boolean
  isClearingScreens: boolean
  isRemovingScreen: boolean
  autoSaveToTempDashboard: () => Promise<void> | void
}

export default function ScreenControls({
  showScreenControls,
  setShowScreenControls,
  screens,
  currentScreenIndex,
  setCurrentScreenIndex,
  addScreen,
  clearAllScreens,
  removeScreen,
  isAddingScreen,
  isClearingScreens,
  isRemovingScreen,
  autoSaveToTempDashboard,
}: Props) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <button
        onClick={() => setShowScreenControls((v) => !v)}
        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        title={showScreenControls ? "Hide screen controls" : "Show screen controls"}
      >
        {showScreenControls ? "Hide" : "Show"} screens
      </button>

      {showScreenControls && (
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <button
            onClick={addScreen}
            disabled={isAddingScreen}
            className={`group relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md border-0 transform hover:scale-105 active:scale-95 ${
              isAddingScreen ? "opacity-75 cursor-not-allowed" : ""
            }`}
            title="Add New Screen"
          >
            {isAddingScreen ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus size={16} className="text-white" />
            )}
          </button>

          <button
            onClick={clearAllScreens}
            disabled={isClearingScreens}
            className={`group relative bg-gradient-to-r from-rose-500 to-rose-600 text-white p-2 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-sm hover:shadow-md border-0 transform hover:scale-105 active:scale-95 ${
              isClearingScreens ? "opacity-75 cursor-not-allowed" : ""
            }`}
            title="Clear All Screens"
          >
            {isClearingScreens ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Trash2 size={16} className="text-white" />
            )}
          </button>

          {screens.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const nextIndex = currentScreenIndex > 0 ? currentScreenIndex - 1 : screens.length - 1
                  setCurrentScreenIndex(nextIndex)
                  setTimeout(() => {
                    autoSaveToTempDashboard()
                  }, 100)
                }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-800"
                title="Previous Screen"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>
              <button
                onClick={() => {
                  const nextIndex = currentScreenIndex < screens.length - 1 ? currentScreenIndex + 1 : 0
                  setCurrentScreenIndex(nextIndex)
                  setTimeout(() => {
                    autoSaveToTempDashboard()
                  }, 100)
                }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-800"
                title="Next Screen"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {screens.map((screen, index) => (
              <div
                key={screen.id}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 min-w-[80px] justify-center ${
                  index === currentScreenIndex
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                }`}
                onClick={() => {
                  setCurrentScreenIndex(index)
                  setTimeout(() => {
                    autoSaveToTempDashboard()
                  }, 100)
                }}
              >
                <span className="text-sm font-medium">{index + 1}</span>

                {screens.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeScreen(index)
                    }}
                    disabled={isRemovingScreen}
                    className={`absolute -top-2 -right-2 p-1.5 hover:bg-red-100 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 bg-white border border-red-200 shadow-sm ${
                      isRemovingScreen ? "cursor-not-allowed" : ""
                    }`}
                    title="Remove screen"
                  >
                    {isRemovingScreen ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                    ) : (
                      <X size={12} className="text-red-500 hover:text-red-700" />
                    )}
                  </button>
                )}

                {index === currentScreenIndex && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-500 font-medium px-1.5">
            {screens.length} screen{screens.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  )
}


