/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for localStorage management with quota handling
export const localStorageUtils = {
  // Save data to localStorage with quota handling
  setItem: (key: string, value: any): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const serializedValue = JSON.stringify(value)
      
      // Check if the data is too large (approximate 4MB limit to be safe)
      if (serializedValue.length > 4 * 1024 * 1024) {
        console.warn(`Data for key "${key}" is too large (${(serializedValue.length / 1024 / 1024).toFixed(2)}MB). Consider storing only essential metadata.`)
        return false
      }
      
      localStorage.setItem(key, serializedValue)
      return true
    } catch (error) {
      console.warn(`Failed to save data to localStorage for key "${key}":`, error)
      
      // Try to clear localStorage and retry once
      try {
        localStorage.clear()
        localStorage.setItem(key, JSON.stringify(value))
        console.log('Successfully saved data after clearing localStorage')
        return true
      } catch (retryError) {
        console.error('Failed to save data even after clearing localStorage:', retryError)
        return false
      }
    }
  },

  // Get data from localStorage
  getItem: (key: string): any => {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Failed to load data from localStorage for key "${key}":`, error)
      return null
    }
  },

  // Remove item from localStorage
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Failed to remove item from localStorage for key "${key}":`, error)
      return false
    }
  },

  // Get localStorage usage information
  getUsageInfo: (): { used: number; available: number; total: number } | null => {
    if (typeof window === 'undefined') return null
    
    try {
      let total = 0
      let used = 0
      
      // Calculate used space
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const item = localStorage[key]
          used += item.length + key.length
        }
      }
      
      // Estimate total available space (varies by browser, typically 5-10MB)
      total = 5 * 1024 * 1024 // Assume 5MB as conservative estimate
      
      return {
        used,
        available: total - used,
        total
      }
    } catch (error) {
      console.error('Failed to get localStorage usage info:', error)
      return null
    }
  }
}
