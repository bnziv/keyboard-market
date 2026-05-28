import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthProvider';
import { Search, MessageSquare, User, LogOut, Plus, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from 'react';
import { useToast } from '@/utils/ToastProvider';
import { useTheme } from '@/utils/ThemeProvider';
import { useChat } from '@/utils/ChatProvider';

interface NavBarProps {
  className?: string;
  activePage?: 'home' | 'listings' | 'create' | 'messages' | 'profile' | 'groupbuys';
}

export default function NavBar({ className, activePage }: NavBarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { showInfo } = useToast();
  const { theme, toggle } = useTheme();
  const { toggleConversations } = useChat();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleCreateListing = () => {
    if (isAuthenticated) {
      navigate('/create-listing');
    } else {
      showInfo('You must be logged in to create a listing');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/listings?title=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className={cn('sticky top-0 z-50 flex items-center gap-4 px-6 h-14 border-b bg-km-bg border-km-line', className)}>
      {/* Brand */}
      <Link
        to="/"
        className="flex-shrink-0 text-base font-bold tracking-tight font-km-body text-km-ink"
      >
        <span className="text-km-gold">◆</span>{' '}
        <span style={{ letterSpacing: '-0.02em' }}>KBMARKET</span>
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm ml-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-text bg-km-surface-2 border-km-line text-km-ink-mute font-km-mono"
          onClick={() => document.getElementById('nav-search')?.focus()}
        >
          <Search size={12} className="text-km-ink-mute flex-shrink-0" />
          <input
            id="nav-search"
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="search keycaps, switches, PCBs…"
            className="flex-1 bg-transparent outline-none text-km-ink-dim font-km-mono text-[11px]"
          />
          <span className="ml-auto opacity-60 text-[10px]">⌘K</span>
        </div>
      </form>

      {/* Nav links */}
      <nav className="ml-auto flex items-center gap-1">
        {[
          { id: 'listings' as const, label: 'Browse', href: '/listings' },
          { id: 'groupbuys' as const, label: 'Group Buys', href: '/group-buys' },
          { id: 'create' as const, label: 'Sell', href: '/create-listing' },
        ].map(link => (
          <Link
            key={link.id}
            to={link.href}
            onClick={link.id === 'create' ? (e) => { e.preventDefault(); handleCreateListing(); } : undefined}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors',
              activePage === link.id ? 'text-km-ink' : 'text-km-ink-dim',
            )}
          >
            {link.label}
            {activePage === link.id && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-km-gold" />
            )}
          </Link>
        ))}

        {/* Message icon */}
        <button
          onClick={toggleConversations}
          className="relative ml-1 w-8 h-8 flex items-center justify-center rounded-full border border-km-line text-km-ink-dim bg-transparent transition-colors cursor-pointer"
        >
          <MessageSquare size={14} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-full border border-km-line text-km-ink-dim bg-transparent transition-colors cursor-pointer"
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* User auth */}
        {isAuthenticated ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold border font-km-mono bg-km-gold-soft border-km-gold/33 text-km-gold cursor-pointer">
                {(user?.username?.[0] ?? '?').toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-km-surface border-km-line text-km-ink">
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 cursor-pointer text-km-ink">
                  <User size={14} /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/create-listing" className="flex items-center gap-2 cursor-pointer text-km-ink">
                  <Plus size={14} /> Create Listing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-km-line" />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer text-km-error"
              >
                <LogOut size={14} /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="ml-2 px-3 py-1.5 text-xs font-semibold rounded border font-km-body bg-km-gold border-km-gold text-km-bg cursor-pointer"
          >
            Login
          </button>
        )}
      </nav>
    </header>
  );
}
