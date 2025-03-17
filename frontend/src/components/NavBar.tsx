import { Link, useLocation } from 'react-router-dom';
import { Button } from "./ui/button"
import { useAuth } from '@/utils/AuthProvider';

export default function NavBar() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between py-4 px-6">
        <Link to="/" className="text-2xl font-bold">
          Keyboard Market
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant={location.pathname === "/listings" ? "default" : "ghost"} asChild>
            <Link to="/listings">Listings</Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/create-listing">Create Listing</Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant={location.pathname === "/login" ? "default" : "ghost"} asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
