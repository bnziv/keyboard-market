import { Link, useLocation } from 'react-router-dom';
import { Button } from "./ui/button"

export default function NavBar() {
  const location = useLocation();

  return (
    <nav className="border-b">
      <div className="container flex items-center justify-between py-4 px-6">
        <Link to="/" className="text-2xl font-bold">
          Keyboard Market
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant={location.pathname === "/listings" ? "default" : "ghost"} asChild>
            <Link to="/listings">Listings</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
