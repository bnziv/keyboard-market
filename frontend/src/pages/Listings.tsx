import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/utils/api';
import ListingCard, { ListingCardProps } from '@/components/ListingCard';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface FilterState {
  minPrice: number;
  maxPrice: number;
  offers: boolean | null;
  condition: string | null;
  title: string;
  sortBy: string;
  sortDirection: string;
}

const CONDITIONS = ['New', 'Like New', 'Used'];
const SORT_OPTIONS = [
  { value: 'createdOn_desc', label: 'Newest first' },
  { value: 'createdOn_asc', label: 'Oldest first' },
  { value: 'price_asc', label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
];

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between pb-2 mb-2.5 text-[10px] uppercase tracking-[0.15em] border-b font-km-mono text-km-ink-mute border-km-line">
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function CheckLine({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 cursor-pointer"
      onClick={onChange}
    >
      <div
        className={cn(
          'w-3.5 h-3.5 flex items-center justify-center border rounded-sm flex-shrink-0',
          checked
            ? 'bg-km-ink border-km-ink'
            : 'bg-transparent border-km-line-strong',
        )}
      >
        {checked && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1 4L3 6L7 2"
              stroke="var(--km-bg)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-xs text-km-ink-dim">{label}</span>
    </div>
  );
}

function FilterContent({
  filters,
  setFilters,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  return (
    <>
      <FilterSection label="Search">
        <input
          type="text"
          placeholder="title, brand, model…"
          value={filters.title}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, title: e.target.value }))
          }
          className="w-full px-3 py-1.5 rounded border text-xs outline-none bg-km-bg border-km-line text-km-ink font-km-mono"
        />
      </FilterSection>

      <FilterSection label="Price">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 px-2.5 py-1.5 rounded border text-xs bg-km-bg border-km-line text-km-ink font-km-mono">
            ${filters.minPrice}
          </div>
          <div className="flex-1 px-2.5 py-1.5 rounded border text-xs bg-km-bg border-km-line text-km-ink font-km-mono">
            ${filters.maxPrice}
          </div>
        </div>
        <Slider
          min={0}
          max={1000}
          step={10}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) =>
            setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }))
          }
          className="[&_[role=slider]]:bg-km-ink [&_.range]:bg-km-gold"
        />
      </FilterSection>

      <FilterSection label="Condition">
        {CONDITIONS.map((c) => (
          <CheckLine
            key={c}
            label={c}
            checked={filters.condition === c.toLowerCase()}
            onChange={() =>
              setFilters((prev) => ({
                ...prev,
                condition:
                  prev.condition === c.toLowerCase() ? null : c.toLowerCase(),
              }))
            }
          />
        ))}
      </FilterSection>

      <FilterSection label="Seller">
        <CheckLine
          label="Accepts offers"
          checked={filters.offers === true}
          onChange={() =>
            setFilters((prev) => ({
              ...prev,
              offers: prev.offers === true ? null : true,
            }))
          }
        />
      </FilterSection>

      <button
        onClick={() =>
          setFilters({
            minPrice: 0,
            maxPrice: 1000,
            offers: null,
            condition: null,
            title: '',
            sortBy: 'createdOn',
            sortDirection: 'desc',
          })
        }
        className="w-full mt-2 py-2 text-xs rounded border text-center transition-colors hover:opacity-80 font-km-mono text-km-gold border-km-line bg-transparent cursor-pointer tracking-[0.05em]"
      >
        Clear all filters
      </button>
    </>
  );
}

export default function Listings() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [density, setDensity] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 1000,
    offers: null,
    condition: null,
    title: searchParams.get('title') || '',
    sortBy: 'createdOn',
    sortDirection: 'desc',
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const debouncedFilters = useDebounce(filters, 500);

  const lastListingRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((p) => p + 1);
          }
        },
        { threshold: 0.1 },
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  useEffect(() => {
    setListings([]);
    setPage(0);
    fetchListings(true);
  }, [debouncedFilters]);

  useEffect(() => {
    if (page > 0) fetchListings(false);
  }, [page]);

  const fetchListings = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const { minPrice, maxPrice, ...rest } = debouncedFilters;
      const response = await api.get(`/api/listings/filtered`, {
        params: {
          ...rest,
          minPrice: minPrice * 100,
          maxPrice: maxPrice * 100,
          page: currentPage,
          size: 12,
        },
      });
      const { listings: newListings, totalPages } = response.data;
      setListings((prev) => (reset ? newListings : [...prev, ...newListings]));
      setHasMore(currentPage < totalPages - 1);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortValue = `${filters.sortBy}_${filters.sortDirection}`;
  const handleSortChange = (val: string) => {
    const [sortBy, sortDirection] = val.split('_');
    setFilters((prev) => ({ ...prev, sortBy, sortDirection }));
  };

  return (
    <div className="min-h-dvh flex flex-col bg-km-bg text-km-ink">
      <div className="flex flex-1" style={{ minHeight: 'calc(100dvh - 56px)' }}>
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 h-dvh self-start sticky top-0 p-6 border-r overflow-y-auto bg-km-bg-sub border-km-line text-xs">
          <FilterContent filters={filters} setFilters={setFilters} />
        </aside>

        {/* Main content */}
        <section className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
          {/* Header bar */}
          <div className="flex flex-col gap-3 sm:items-center sm:flex-row sm:justify-between mb-6">
            <div>
              <div className="font-km-mono text-[11px] uppercase tracking-[0.15em] mb-1 text-km-gold">
                {listings.length > 0
                  ? `Showing ${listings.length} results`
                  : 'All listings'}
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-km-ink">
                Browse listings
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Filters button — mobile only */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded border-km-line bg-km-surface text-km-ink font-km-mono cursor-pointer"
              >
                <SlidersHorizontal size={12} /> Filters
              </button>

              {/* Sort */}
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="h-8 text-xs border gap-2 bg-km-surface border-km-line text-km-ink font-km-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-km-surface border-km-line text-km-ink">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-km-ink"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Density toggle */}
              <div className="flex border rounded overflow-hidden border-km-line bg-km-surface">
                <button
                  onClick={() => setDensity('grid')}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center transition-colors border-none cursor-pointer',
                    density === 'grid'
                      ? 'bg-km-ink text-km-bg'
                      : 'bg-transparent text-km-ink-dim',
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setDensity('list')}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center transition-colors border-none cursor-pointer',
                    density === 'list'
                      ? 'bg-km-ink text-km-bg'
                      : 'bg-transparent text-km-ink-dim',
                  )}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Listings */}
          {density === 'grid' ? (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              }}
            >
              {listings.map((listing, i) => (
                <div
                  key={listing.id}
                  ref={i === listings.length - 1 ? lastListingRef : undefined}
                >
                  <ListingCard {...listing} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col border rounded overflow-hidden border-km-line">
              {listings.map((listing, i) => (
                <a
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  ref={
                    i === listings.length - 1
                      ? (lastListingRef as any)
                      : undefined
                  }
                  className="flex items-center gap-4 px-4 py-3 border-b border-km-line bg-km-surface text-km-ink transition-colors hover:bg-km-surface-2 no-underline min-w-0"
                >
                  <div
                    className="w-20 flex-shrink-0 rounded overflow-hidden bg-km-bg-sub"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {listing.imageUrl && (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-km-ink">
                      {listing.title}
                    </div>
                    <div className="text-xs mt-0.5 text-km-ink-mute font-km-mono">
                      {listing.condition}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm text-km-ink font-km-mono">
                      {listing.price
                        ? `$${parseFloat(listing.price.toFixed(2))}`
                        : 'Open to Offers'}
                    </div>
                    {listing.offers && listing.price > 0 && (
                      <div className="text-[10px] text-km-gold font-km-mono">
                        OBO
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-km-gold" />
            </div>
          )}

          {!loading && !hasMore && listings.length > 0 && (
            <div className="text-center py-8 text-xs font-km-mono text-km-ink-mute tracking-[0.1em]">
              — end of results —
            </div>
          )}

          {!loading && listings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-4xl text-km-line-strong">◆</div>
              <div className="text-sm text-km-ink-mute font-km-mono">
                No listings found. Try adjusting your filters.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setFiltersOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-km-bg-sub rounded-t-2xl md:hidden flex flex-col"
              style={{ maxHeight: '82dvh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-9 h-1 rounded-full bg-km-line-strong" />
              </div>

              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-km-line flex-shrink-0">
                <span className="font-km-mono text-[11px] uppercase tracking-[0.15em] text-km-ink">
                  Filters
                </span>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-km-line text-km-ink-dim bg-transparent cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Scrollable filter content */}
              <div className="overflow-y-auto p-5 text-xs">
                <FilterContent filters={filters} setFilters={setFilters} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
