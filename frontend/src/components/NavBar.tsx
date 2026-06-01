import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthProvider';
import { Search, MessageSquare, User, LogOut, Plus, Sun, Moon, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from 'react';
import { useToast } from '@/utils/ToastProvider';
import { useTheme } from '@/utils/ThemeProvider';
import { useChat } from '@/utils/ChatProvider';

interface NavBarProps {
  className?: string;
}

export default function NavBar({ className }: NavBarProps) {
  const { pathname } = useLocation();
  const activePage = pathname === '/' ? 'home'
    : pathname.startsWith('/listings') ? 'listings'
    : pathname.startsWith('/create-listing') ? 'create'
    : pathname.startsWith('/group-buys') ? 'groupbuys'
    : pathname.startsWith('/profile') ? 'profile'
    : undefined;

  const { isAuthenticated, user, logout } = useAuth();
  const { showInfo } = useToast();
  const { theme, toggle } = useTheme();
  const { toggleConversations } = useChat();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <header className={cn('sticky top-0 z-50 relative flex items-center gap-4 px-6 h-14 border-b bg-km-bg border-km-line', className)}>
      {/* Brand */}
      <Link
        to="/"
        className="flex-shrink-0 text-base font-bold tracking-tight font-km-body text-km-ink"
      >
        <span className="text-km-gold">◆</span>{' '}
        <span style={{ letterSpacing: '-0.02em' }}>KBMARKET</span>
      </Link>

      {/* Search — hidden on mobile */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm ml-4">
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

      {/* Nav links — hidden on mobile */}
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
              'relative hidden md:inline-flex px-3 py-2 text-sm font-medium transition-colors',
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

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="ml-1 md:hidden w-8 h-8 flex items-center justify-center rounded-full border border-km-line text-km-ink-dim bg-transparent cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 z-40 bg-km-bg border-b border-km-line p-4 flex flex-col gap-1 md:hidden shadow-md">
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="mb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-km-surface-2 border-km-line text-km-ink-mute font-km-mono">
              <Search size={12} className="text-km-ink-mute flex-shrink-0" />
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="search keycaps, switches, PCBs…"
                className="flex-1 bg-transparent outline-none text-km-ink-dim font-km-mono text-[11px]"
                autoFocus
              />
            </div>
          </form>
          {[
            { id: 'listings' as const, label: 'Browse', href: '/listings' },
            { id: 'groupbuys' as const, label: 'Group Buys', href: '/group-buys' },
            { id: 'create' as const, label: 'Sell', href: '/create-listing' },
          ].map(link => (
            <Link
              key={link.id}
              to={link.href}
              onClick={(e) => {
                if (link.id === 'create') { e.preventDefault(); handleCreateListing(); }
                setMobileOpen(false);
              }}
              className={cn(
                'px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                activePage === link.id
                  ? 'bg-km-surface-2 text-km-ink'
                  : 'text-km-ink-dim hover:bg-km-surface-2',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
