'use client'

import { usePublicNoticeSettings } from '@/hooks/usePublicNoticeSettings';
import { useEffect, useState } from 'react';

const NoticeFooter = () => {
    const currentYear = new Date().getFullYear();
    const [mounted, setMounted] = useState(false);
    const { settings, loading } = usePublicNoticeSettings();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (loading || !mounted) {
        return (
            <div 
                className="bg-slate-800 bg-opacity-95 backdrop-blur-sm shadow-lg border-t border-blue-500/30 mt-6"
                style={{ backgroundColor: settings?.footerBackgroundColor || '#1e293b' }}
            >
                <div className="w-full px-4 py-3">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="bg-slate-800 bg-opacity-95 backdrop-blur-sm shadow-lg border-t border-blue-500/30 flex-shrink-0"
            style={{ 
                backgroundColor: settings?.footerBackgroundColor || '#1e293b',
                borderTopColor: settings?.accentColor || '#3b82f6',
                color: settings?.fontColor || '#ffffff'
            }}
            suppressHydrationWarning={true}
        >
            <div className="w-full px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                    {/* Left side - Copyright */}
                    <div className="opacity-90">
                        © {mounted ? currentYear : '----'} {settings?.title || "Digital Notice Board"}. All rights reserved.
                    </div>
                    
                    {/* Center - Department info */}
                    <div className="font-medium opacity-90">
                        {settings?.departmentName || "Information Technology Department"}
                    </div>
                    
                    {/* Right side - Version/Status */}
                    <div className="flex items-center space-x-2">
                        <div 
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: settings?.accentColor || '#3b82f6' }}
                        ></div>
                        <span className="opacity-90">Live</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeFooter; 