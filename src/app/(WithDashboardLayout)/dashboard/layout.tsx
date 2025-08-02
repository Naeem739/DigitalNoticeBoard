'use client'

import { useState } from 'react'
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SidebarOverlay from './components/SidebarOverlay';
import { useSession } from "next-auth/react";
import Loading from '@/app/loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (status === "loading") return <Loading></Loading>;
  if (!session) return <p>Access Denied</p>;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex flex-col flex-1">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          {children}
        </main>
      </div>
      <SidebarOverlay isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}

