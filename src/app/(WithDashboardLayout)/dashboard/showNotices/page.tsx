'use client'
import { NoticeBoardLoader } from "@/components/ui/loader";
import { WidgetContainer } from "./components/edit-dashboard-demo-two";
import { useState } from "react";

const ShowNoticesPage = () => {
  // Optionally, you can add a loading state if you want to show a loader while WidgetContainer fetches
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <NoticeBoardLoader />
      </div>
    );
  }

  // WidgetContainer fetches and displays notices from the Notice model
  return (
    <div>
      <WidgetContainer data={{}} />
    </div>
  );
};

export default ShowNoticesPage;