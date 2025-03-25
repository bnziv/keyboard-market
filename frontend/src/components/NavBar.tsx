import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { useAuth } from '@/utils/AuthProvider';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import LoginForm from '@/components/LoginForm';
import { ChevronDown, LogOut, User, Package, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavBar({ className }: { className?: string }) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className={cn("border-b bg-white", className)}>
      <div className="flex items-center justify-between py-4 px-6">
        <Link to="/" className="text-2xl font-bold">
          Keyboard Market
        </Link>

        <div className="flex items-center space-x-4">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 text-lg">
                Listings <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild className="text-md">
                <Link to="/listings" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  View Listings
                </Link>
              </DropdownMenuItem>
              {isAuthenticated && (
                <DropdownMenuItem asChild className="text-md">
                  <Link to="/create-listing" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Listing
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {isAuthenticated ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 text-lg">
                  {user?.username} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="text-md">
                  <Link to={`/profile/${user?.username}`} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600 text-md">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Login</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
                <LoginForm />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </nav>
  );
}
