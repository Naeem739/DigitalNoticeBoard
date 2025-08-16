import { Bell, Search, User, Menu, Shield, Crown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { signOut, useSession } from 'next-auth/react'

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const handleLogout = async () => {
    console.log("Attempting to sign out...");
    await signOut({
      redirect: true,
      callbackUrl: "/login",
    });
    console.log("Signed out.");
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return <Badge variant="destructive" className="text-xs"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>
      case 'ADMIN':
        return <Badge variant="default" className="text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
      case 'MODERATOR':
        return <Badge variant="secondary" className="text-xs"><Shield className="w-3 h-3 mr-1" />Moderator</Badge>
      case 'USER':
        return <Badge variant="outline" className="text-xs"><User className="w-3 h-3 mr-1" />User</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }

  return (
    <header className="bg-white shadow-md py-4 px-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-2 z-50" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative">
          
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {getRoleBadge()}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name || 'Administrator'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email || 'admin@smartnoticeboard.com'}
                </p>
                <p className="text-xs leading-none text-blue-600 font-medium">
                  {session?.user?.role || 'ADMIN'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Header

