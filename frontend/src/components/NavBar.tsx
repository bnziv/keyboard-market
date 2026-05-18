import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthProvider';
import { Search, MessageSquare, User, LogOut, Plus, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from 'react';
import { useToast } from '@/utils/ToastProvider';
import { useTheme } from '@/utils/ThemeProvider';

interface NavBarProps {
  className?: string;
  activePage?: 'home' | 'listings' | 'create' | 'messages' | 'profile';
}

export default function NavBar({ className, activePage }: NavBarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { showInfo } = useToast();
  const { theme, toggle } = useTheme();
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
    <header
      className={cn('sticky top-0 z-50 flex items-center gap-4 px-6 h-14 border-b', className)}
      style={{ background: 'var(--km-bg)', borderColor: 'var(--km-line)' }}
    >
      {/* Brand */}
      <Link
        to="/"
        className="flex-shrink-0 text-base font-bold tracking-tight"
        style={{ fontFamily: 'var(--km-font-body)', color: 'var(--km-ink)' }}
      >
        <span style={{ color: 'var(--km-gold)' }}>◆</span>{' '}
        <span style={{ letterSpacing: '-0.02em' }}>KBMARKET</span>
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm ml-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-text"
          style={{
            background: 'var(--km-surface-2)',
            borderColor: 'var(--km-line)',
            color: 'var(--km-ink-mute)',
            fontFamily: 'var(--km-font-mono)',
          }}
          onClick={() => document.getElementById('nav-search')?.focus()}
        >
          <Search size={12} style={{ color: 'var(--km-ink-mute)', flexShrink: 0 }} />
          <input
            id="nav-search"
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="search keycaps, switches, PCBs…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)', fontSize: '11px' }}
          />
          <span className="ml-auto opacity-60" style={{ fontSize: '10px' }}>⌘K</span>
        </div>
      </form>

      {/* Nav links */}
      <nav className="ml-auto flex items-center gap-1">
        {[
          { id: 'listings' as const, label: 'Browse', href: '/listings' as const },
          { id: 'create' as const, label: 'Sell', href: null as null },
        ].map(link =>
          link.href ? (
            <Link
              key={link.id}
              to={link.href}
              className="relative px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: activePage === link.id ? 'var(--km-ink)' : 'var(--km-ink-dim)' }}
            >
              {link.label}
              {activePage === link.id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5" style={{ background: 'var(--km-gold)' }} />
              )}
            </Link>
          ) : (
            <button
              key={link.id}
              onClick={handleCreateListing}
              className="relative px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color: activePage === link.id ? 'var(--km-ink)' : 'var(--km-ink-dim)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {link.label}
            </button>
          )
        )}

        {/* Message icon */}
        <button
          className="relative ml-1 w-8 h-8 flex items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: 'var(--km-line)', color: 'var(--km-ink-dim)', background: 'transparent', cursor: 'pointer' }}
        >
          <MessageSquare size={14} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: 'var(--km-line)', color: 'var(--km-ink-dim)', background: 'transparent', cursor: 'pointer' }}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* User auth */}
        {isAuthenticated ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold border"
                style={{
                  fontFamily: 'var(--km-font-mono)',
                  background: 'var(--km-gold-soft)',
                  borderColor: 'rgba(212,178,76,0.33)',
                  color: 'var(--km-gold)',
                  cursor: 'pointer',
                }}
              >
                {(user?.username?.[0] ?? '?').toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)', color: 'var(--km-ink)' }}
            >
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--km-ink)' }}>
                  <User size={14} /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/create-listing" className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--km-ink)' }}>
                  <Plus size={14} /> Create Listing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: 'var(--km-line)' }} />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 cursor-pointer"
                style={{ color: 'hsl(0 62.8% 55%)' }}
              >
                <LogOut size={14} /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="ml-2 px-3 py-1.5 text-xs font-semibold rounded border"
            style={{
              background: 'var(--km-gold)',
              borderColor: 'var(--km-gold)',
              color: theme === 'dark' ? 'var(--km-bg)' : '#fff',
              fontFamily: 'var(--km-font-body)',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        )}
      </nav>
    </header>
  );
}
