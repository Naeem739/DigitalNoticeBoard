'use client'
import { useEffect, useState } from 'react';
import { usePublicNoticeSettings } from '@/hooks/usePublicNoticeSettings';

interface NoticeHeaderProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (pageIndex: number) => void;
    autoPaginationEnabled?: boolean;
    timeUntilNextPage?: number;
    onToggleAutoPagination?: () => void;
    // Dashboard navigation props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dashboards?: any[];
    currentDashboardIndex?: number;
    onDashboardChange?: (index: number) => void;
    countdown?: number;
}

const NoticeHeader = ({ 
    totalPages, 
    currentPage, 
    onPageChange, 
    autoPaginationEnabled = false, 
    timeUntilNextPage = 60,
    onToggleAutoPagination,
    dashboards = [],
    currentDashboardIndex = 0,
    onDashboardChange,
    countdown = 0
}: NoticeHeaderProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const { settings, loading } = usePublicNoticeSettings();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, [mounted]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading || !mounted) {
        return (
            <div 
                className="bg-slate-800 bg-opacity-95 backdrop-blur-sm shadow-lg p-4 mb-6 border-b border-blue-500/30"
                style={{ backgroundColor: settings?.headerBackgroundColor || '#1e293b' }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="bg-slate-800 bg-opacity-95 backdrop-blur-sm shadow-lg p-4 border-b border-blue-500/30 flex-shrink-0"
            style={{ 
                backgroundColor: settings?.headerBackgroundColor || '#1e293b',
                borderBottomColor: settings?.accentColor || '#3b82f6'
            }}
            suppressHydrationWarning={true}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left side - Logo and Title */}
                <div className="flex items-center space-x-4">
                    {/* Logo */}
                    {settings?.logo ? (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                            <img 
                                src={settings.logo} 
                                alt="Logo" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                            style={{ 
                                background: `linear-gradient(135deg, ${settings?.accentColor || '#3b82f6'} 0%, ${settings?.accentColor || '#3b82f6'}80 100%)`
                            }}
                        >
                            <svg 
                                className="w-7 h-7 text-white" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2C13.1 2 14 2.9 14 4V5.5C17.6 6.2 20.5 9.1 21.2 12.7C21.3 13.3 20.8 13.8 20.2 13.8H3.8C3.2 13.8 2.7 13.3 2.8 12.7C3.5 9.1 6.4 6.2 10 5.5V4C10 2.9 10.9 2 12 2Z"/>
                                <path d="M9 15.5C9 16.9 10.1 18 11.5 18H12.5C13.9 18 15 16.9 15 15.5V14H9V15.5Z"/>
                            </svg>
                        </div>
                    )}
                    
                    {/* Title and Subtitle */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">{settings?.title || "Smart Notice Board"}</h1>
                        <p className="text-sm text-gray-300">{settings?.subtitle || "Information Technology Department"}</p>
                    </div>
                </div>

                {/* Right side - Time, Date, Emergency Contact, and Pagination */}
                <div className="flex items-center space-x-6">
                    {/* Time and Date */}
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {mounted ? formatTime(currentTime) : '--:--:-- --'}
                        </div>
                        <div className="text-sm text-gray-300">
                            {mounted ? formatDate(currentTime) : 'Loading...'}
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-400 font-medium text-sm">Emergency Contact:</span>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-white">{settings?.emergencyNumber || "01734528367"}</div>
                            <div className="text-xs text-gray-300">({settings?.emergencyContact || "Md. Rashid Al Asif"})</div>
                        </div>
                    </div>

                    {/* Dashboard Navigation */}
                    {dashboards.length > 0 && (
                        <div 
                            className="flex items-center space-x-3 bg-purple-500 bg-opacity-20 rounded-full px-4 py-2 border border-purple-400/30"
                            style={{ 
                                backgroundColor: `${settings?.accentColor || '#8b5cf6'}20`,
                                borderColor: `${settings?.accentColor || '#8b5cf6'}30`
                            }}
                        >
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-purple-300 text-xs font-medium">
                                    Dashboard {currentDashboardIndex + 1}/{dashboards.length}
                                </span>
                                {autoPaginationEnabled && countdown > 0 && (
                                    <span className="text-purple-200 text-xs">
                                        ({countdown}s)
                                    </span>
                                )}
                            </div>
                            
                            <button
                                onClick={() => onDashboardChange?.(currentDashboardIndex - 1)}
                                disabled={currentDashboardIndex === 0}
                                className="px-2 py-1 text-white rounded text-xs hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                                style={{ 
                                    backgroundColor: settings?.accentColor || '#8b5cf6',
                                    '--tw-hover-bg-opacity': '0.8'
                                } as React.CSSProperties}
                            >
                                ←
                            </button>
                            
                            <div className="flex items-center space-x-1">
                                {dashboards.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onDashboardChange?.(index)}
                                        className="w-2 h-2 rounded-full transition-colors"
                                        style={{
                                            backgroundColor: index === currentDashboardIndex 
                                                ? settings?.accentColor || '#8b5cf6'
                                                : '#6b7280'
                                        }}
                                        title={`Dashboard ${index + 1}`}
                                    />
                                ))}
                            </div>
                            
                            <button
                                onClick={() => onDashboardChange?.(currentDashboardIndex + 1)}
                                disabled={currentDashboardIndex === dashboards.length - 1}
                                className="px-2 py-1 text-white rounded text-xs hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                                style={{ 
                                    backgroundColor: settings?.accentColor || '#8b5cf6',
                                    '--tw-hover-bg-opacity': '0.8'
                                } as React.CSSProperties}
                            >
                                →
                            </button>
                        </div>
                    )}

                    {/* Auto Pagination Status with Toggle */}
                    {totalPages > 1 && (
                        <div 
                            className="flex items-center space-x-2 bg-green-500 bg-opacity-20 rounded-full px-3 py-2 border border-green-400/30 cursor-pointer hover:bg-opacity-30 transition-all duration-200"
                            style={{ 
                                backgroundColor: `${settings?.accentColor || '#10b981'}20`,
                                borderColor: `${settings?.accentColor || '#10b981'}30`
                            }}
                            onClick={onToggleAutoPagination}
                            title={autoPaginationEnabled ? 'Click to disable auto pagination' : 'Click to enable auto pagination'}
                        >
                            <div className={`w-2 h-2 rounded-full ${autoPaginationEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className="text-green-300 text-xs font-medium">
                                {autoPaginationEnabled ? `Auto: ${timeUntilNextPage}s` : 'Manual Mode'}
                            </span>
                            <button
                                className="ml-1 px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleAutoPagination?.();
                                }}
                            >
                                {autoPaginationEnabled ? '⏸️' : '▶️'}
                            </button>
                        </div>
                    )}

                    {/* Enhanced Pagination Controls */}
                    {totalPages > 1 && (
                        <div 
                            className="flex items-center space-x-3 bg-blue-500 bg-opacity-20 rounded-lg px-4 py-2 border border-blue-400/30"
                            style={{ 
                                backgroundColor: `${settings?.accentColor || '#3b82f6'}20`,
                                borderColor: `${settings?.accentColor || '#3b82f6'}30`
                            }}
                        >
                            <div className="flex items-center space-x-2">
                                <span className="text-blue-300 text-xs font-medium">Dashboard:</span>
                                <button
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className="px-3 py-1 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                                    style={{ 
                                        backgroundColor: settings?.accentColor || '#3b82f6',
                                        '--tw-hover-bg-opacity': '0.8'
                                    } as React.CSSProperties}
                                >
                                    ← Prev
                                </button>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onPageChange(i)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            i === currentPage 
                                                ? 'text-white' 
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                        style={{
                                            backgroundColor: i === currentPage 
                                                ? settings?.accentColor || '#3b82f6'
                                                : 'transparent'
                                        }}
                                        title={`Dashboard ${i + 1}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                {totalPages > 8 && (
                                    <span className="text-xs text-gray-300 ml-1">...</span>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className="px-3 py-1 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                                    style={{ 
                                        backgroundColor: settings?.accentColor || '#3b82f6',
                                        '--tw-hover-bg-opacity': '0.8'
                                    } as React.CSSProperties}
                                >
                                    Next →
                                </button>
                                <span className="text-xs text-gray-200 font-medium">
                                    {currentPage + 1} of {totalPages}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoticeHeader; 