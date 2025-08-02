'use client'
import { getDashboards, getAllDashboards, getDashboardByIndex } from "@/app/actions/dashboard.action";
import Loading from "@/app/loading";
import { TDashboard2 } from "@/types/types";
import { useEffect, useState } from "react";

import { WidgetContainer } from "./components/edit-dashboard-demo-two";

type TResult = {
    success: boolean
    result : TDashboard2
}

type TAllDashboardsResult = {
    success: boolean
    result: any[]
}

const PublicNoticeBoard = ()=>{
    const [dashboard, setDashboard] = useState<TDashboard2 | null >(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [allDashboards, setAllDashboards] = useState<any[]>([]);
    const [countdown, setCountdown] = useState<number>(30);

    useEffect(() => {
        const getData = async () => {
            // Get all dashboards for pagination
            const allDashboardsResult = await getAllDashboards() as TAllDashboardsResult;
            if (allDashboardsResult.success) {
                setAllDashboards(allDashboardsResult.result);
                setTotalPages(allDashboardsResult.result.length);
                
                // Load first dashboard
                if (allDashboardsResult.result.length > 0) {
                    const firstDashboard = await getDashboardByIndex(0) as TResult;
                    if (firstDashboard.success) {
                        setDashboard(firstDashboard.result);
                    }
                }
            }
            setLoading(false);
        };
    
        getData();
    }, []);

    // Countdown timer effect
    useEffect(() => {
        if (totalPages <= 1) return;

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return 30; // Reset to 30 seconds
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [totalPages]);

    // Auto-pagination effect
    useEffect(() => {
        if (totalPages <= 1) return;

        const interval = setInterval(async () => {
            const nextPage = (currentPage + 1) % totalPages;
            setCurrentPage(nextPage);
            setCountdown(30); // Reset countdown
            
            const dashboardResult = await getDashboardByIndex(nextPage) as TResult;
            if (dashboardResult.success) {
                setDashboard(dashboardResult.result);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [currentPage, totalPages]);

    // Manual page navigation
    const goToPage = async (pageIndex: number) => {
        if (pageIndex >= 0 && pageIndex < totalPages) {
            setCurrentPage(pageIndex);
            setCountdown(30); // Reset countdown when manually navigating
            const dashboardResult = await getDashboardByIndex(pageIndex) as TResult;
            if (dashboardResult.success) {
                setDashboard(dashboardResult.result);
            }
        }
    };

    if(loading){
        return <Loading></Loading>
    }

    return (
        <div className="relative">
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToPage(i)}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        i === currentPage 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    title={`Page ${i + 1}`}
                                />
                            ))}
                        </div>
                        
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages - 1}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                        
                        <div className="text-sm text-gray-600 ml-4">
                            Page {currentPage + 1} of {totalPages}
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center gap-2 ml-4">
                            <div className="w-4 h-4 relative">
                                <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 16 16">
                                    <circle
                                        cx="8"
                                        cy="8"
                                        r="6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        className="text-gray-300"
                                    />
                                    <circle
                                        cx="8"
                                        cy="8"
                                        r="6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        className="text-blue-500"
                                        strokeDasharray={`${(countdown / 30) * 37.7} 37.7`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-600">
                                {countdown}s
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Content */}
            {dashboard && <WidgetContainer data={dashboard}></WidgetContainer>}
            
            {/* No Dashboards Message */}
            {!dashboard && totalPages === 0 && (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">No Dashboards Available</h1>
                        <p className="text-gray-600 text-lg">No dashboard records found in the database.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicNoticeBoard;