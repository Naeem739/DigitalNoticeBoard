/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { NoticeBoardLoader } from "@/components/ui/loader";
import { WidgetContainer } from "./components/edit-dashboard-demo-two";
import { useState, useEffect } from "react";

const ShowNoticesPage = () => {
  // Optionally, you can add a loading state if you want to show a loader while WidgetContainer fetches
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <NoticeBoardLoader />
      </div>
    );
  }

  // WidgetContainer fetches and displays notices from the Notice model
    const defaultDashboardData = {
      aspectRatio: 16 / 9,
      notices: [],
      images: [],
      containers: []
    } as any;
  
    return (
      <div>
        <WidgetContainer data={defaultDashboardData} />
      </div>
    );
};

export default ShowNoticesPage;