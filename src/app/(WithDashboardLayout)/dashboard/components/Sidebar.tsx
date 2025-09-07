"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import type React from "react"
import { motion } from "framer-motion"
import { Sidebar as UISidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { 
  Home,
  FolderPlus,
  FilePenLine,
  Image,
  Bell,
  Settings,
  Grid3X3,
  Plus,
  List,
  Shield,
  UserCheck,
  UserPlus,
  LayoutDashboard,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Roboto } from "next/font/google"

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] })

// Define the menu structure
const MENU_STRUCTURE = {
  home: { href: '/', icon: <Home className="h-5 w-5" />, label: 'Home' },
  dashboard: { href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  publicNotices: { href: '/notice', icon: <Bell className="h-5 w-5" />, label: 'Public Notices' },
  noticeBoardSettings: { href: '/dashboard/manage-public-notice', icon: <Settings className="h-5 w-5" />, label: 'Notice Board Settings' },
  noticeCategories: { href: '/dashboard/category', icon: <FolderPlus className="h-5 w-5" />, label: 'Notice Categories' },
  manageNotices: {
    title: 'Manage Notices',
    items: [
      { href: '/dashboard/create-notice', icon: <Plus className="h-5 w-5" />, label: 'New Notice' },
      { href: '/dashboard/showNotices', icon: <List className="h-5 w-5" />, label: 'All Notices' },
      { href: '/dashboard/showImageNotices', icon: <Image className="h-5 w-5" />, label: 'Image-Based Notices' },
      { href: '/dashboard/showPDFNotices', icon: <FilePenLine className="h-5 w-5" />, label: 'PDF Notices' },
    ],
  },
  interfaceManagement: {
    title: 'Interface Management',
    items: [
      { href: '/dashboard/layout/edit-dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'New Interface' },
      { href: '/dashboard/noticeInterfaces', icon: <Grid3X3 className="h-5 w-5" />, label: 'All Interfaces' },
    ],
  },
  userManagement: {
    title: 'Manage Users',
    adminItems: [
      { href: '/dashboard/admin/make-moderator', icon: <UserPlus className="h-5 w-5" />, label: 'Add Moderator' },
      { href: '/dashboard/admin/showAllModerator', icon: <UserCheck className="h-5 w-5" />, label: 'Moderators' },
      { href: '/dashboard/admin/set-permission', icon: <Shield className="h-5 w-5" />, label: 'Set Permission' },
    ],
    moderatorItems: [
      { href: '/dashboard/admin/make-user', icon: <UserPlus className="h-5 w-5" />, label: 'Add User' },
      { href: '/dashboard/admin/showAllUsers', icon: <UserCheck className="h-5 w-5" />, label: 'All Users' },
    ],
    superAdminItems: [
      { href: '/dashboard/admin/make-admin', icon: <UserPlus className="h-5 w-5" />, label: 'Add Administrator' },
      { href: '/dashboard/admin/showAllAdmin', icon: <UserCheck className="h-5 w-5" />, label: 'Administrators' },
    ],
  },
} as const

export default function Sidebar({ isOpen, setOpen }: { isOpen: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [fetchedAllowedRoutes, setFetchedAllowedRoutes] = useState<string[] | null>(null)
  const sessionAllowedRoutes: string[] = (session?.user as any)?.allowedRoutes || []

  useEffect(() => {
    const load = async () => {
      if (userRole !== 'MODERATOR') return
      const moderatorId = (session?.user as any)?.id
      if (!moderatorId) return
      try {
        const res = await fetch(`/api/admin/permissions/${moderatorId}`)
        if (res.ok) {
          const json = await res.json()
          const routes: string[] = Array.isArray(json.allowedRoutes) ? json.allowedRoutes : []
          setFetchedAllowedRoutes(Array.from(new Set<string>(['/', '/dashboard', ...routes])))
        }
      } catch {}
    }
    load()
  }, [session?.user?.id, userRole])

  const allowedRoutes: string[] = useMemo(() => (
    userRole === 'MODERATOR' ? (fetchedAllowedRoutes ?? sessionAllowedRoutes) : []
  ), [fetchedAllowedRoutes, sessionAllowedRoutes, userRole])

  const isAllowed = (href: string) => {
    if (userRole !== 'MODERATOR') return true
    if (href === '/dashboard') return true
    if (href === '/') return allowedRoutes.includes('/')
    const enforceable = allowedRoutes.filter(r => r && r !== '/' && r !== '/dashboard')
    return enforceable.some(route => href.startsWith(route))
  }

  const userManagementItems = useMemo(() => {
    if (userRole === 'SUPER_ADMIN') return MENU_STRUCTURE.userManagement.superAdminItems
    if (userRole === 'ADMIN') return MENU_STRUCTURE.userManagement.adminItems
    if (userRole === 'MODERATOR') return MENU_STRUCTURE.userManagement.moderatorItems.filter(item => isAllowed(item.href))
    return []
  }, [userRole, allowedRoutes])

  const links = useMemo(() => {
    const top = [
      MENU_STRUCTURE.home,
      MENU_STRUCTURE.dashboard,
      MENU_STRUCTURE.publicNotices,
    ].filter(link => isAllowed(link.href))

    const singles = [
      MENU_STRUCTURE.noticeBoardSettings,
      MENU_STRUCTURE.noticeCategories,
    ].filter(link => isAllowed(link.href))

    const manageNotices = MENU_STRUCTURE.manageNotices.items.filter(item => isAllowed(item.href))
    const interfaceMgmt = MENU_STRUCTURE.interfaceManagement.items.filter(item => isAllowed(item.href))

    return { top, singles, manageNotices, interfaceMgmt }
  }, [allowedRoutes, userRole])

  const DropdownSection = ({
    title,
    icon,
    children,
  }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const [open, setOpen] = useState(false)
    const [hoverOpen, setHoverOpen] = useState(false)
    const sidebar = useSidebar()
    
    const handleMouseEnter = () => {
      if (!sidebar.open) {
        setTimeout(() => setHoverOpen(true), 100);
      }
    };
    
    const handleMouseLeave = () => {
      setHoverOpen(false);
    };
    
    return (
      <div 
        className="relative flex flex-col gap-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-between text-[18px] leading-6 font-medium text-white py-2 transition-all duration-300"
        >
          <span className="flex items-center gap-3">
            <span className="w-6 flex items-center justify-center text-white">{icon}</span>
            <motion.span 
              className="text-white"
              animate={{
                opacity: sidebar.open ? 1 : 0,
                width: sidebar.open ? "auto" : 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="whitespace-nowrap overflow-hidden"
            >
              {title}
            </motion.span>
          </span>
          <motion.span 
            className="ml-3 text-white"
            animate={{
              opacity: sidebar.open ? 1 : 0,
              width: sidebar.open ? "auto" : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </motion.span>
        </button>
        
        {/* Show dropdown when sidebar is open and menu is clicked */}
        {sidebar.open && open && (
          <motion.div 
            className="pl-7 flex flex-col gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
        
        {/* Show hover dropdown when sidebar is collapsed */}
        {!sidebar.open && hoverOpen && (
          <motion.div 
            className="absolute left-full top-0 ml-2 bg-black text-white p-2 rounded-md shadow-lg min-w-[200px] z-50"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm font-medium mb-2 px-2 py-1 border-b border-gray-600">{title}</div>
            <div className="flex flex-col gap-1">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === SidebarLink) {
                  const link = child.props.link;
                  return (
                    <a
                      href={link.href}
                      className="flex items-center gap-2 px-2 py-1 text-sm text-white hover:bg-gray-700 rounded transition-colors duration-150"
                    >
                      <span className="w-4 h-4 flex items-center justify-center">{link.icon}</span>
                      <span>{link.label}</span>
                    </a>
                  );
                }
                return child;
              })}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <UISidebar open={isOpen} setOpen={setOpen}>
      <SidebarBody className={`gap-2 ${roboto.className} bg-black text-white`}>
        <div className="flex flex-col gap-2">
          {links.top.map((link, idx) => (
            <SidebarLink key={`top-${idx}`} link={link} className="text-white" />
          ))}
        </div>
        {userRole !== 'USER' && (
          <div className="flex flex-col gap-2">
            {links.singles.map((link, idx) => (
              <SidebarLink key={`single-${idx}`} link={link} className="text-white" />
            ))}
            <DropdownSection title={MENU_STRUCTURE.manageNotices.title} icon={<List className="h-5 w-5" />}>
              {links.manageNotices.map((link, idx) => (
                <SidebarLink key={`mn-${idx}`} link={link} className="text-white" />
              ))}
            </DropdownSection>
            <DropdownSection title={MENU_STRUCTURE.interfaceManagement.title} icon={<Grid3X3 className="h-5 w-5" />}>
              {links.interfaceMgmt.map((link, idx) => (
                <SidebarLink key={`im-${idx}`} link={link} className="text-white" />
              ))}
            </DropdownSection>
            <DropdownSection title={MENU_STRUCTURE.userManagement.title} icon={<Shield className="h-5 w-5" />}>
              {userManagementItems.map((link, idx) => (
                <SidebarLink key={`um-${idx}`} link={link} className="text-white" />
              ))}
            </DropdownSection>
          </div>
        )}
        {userRole === 'USER' && (
          <SidebarLink link={{ href: '/dashboard/showNotices', icon: <List className="h-5 w-5" />, label: 'View Notices' }} className="text-white" />
        )}
      </SidebarBody>
    </UISidebar>
  )
}

