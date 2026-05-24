import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import ListingCard, { ListingCardProps } from "@/components/ListingCard";
import NavBar from "@/components/NavBar";
import API_URL from "@/utils/config";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, LayoutGrid, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";

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

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <div
                className="flex items-center justify-between pb-2 mb-2.5 text-xs uppercase tracking-widest border-b"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', borderColor: 'var(--km-line)', letterSpacing: '0.15em', fontSize: '10px' }}
            >
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function CheckLine({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <div className="flex items-center gap-2 py-1.5 cursor-pointer" onClick={onChange}>
            <div
                className="w-3.5 h-3.5 flex items-center justify-center border rounded-sm flex-shrink-0"
                style={{
                    background: checked ? 'var(--km-ink)' : 'transparent',
                    borderColor: checked ? 'var(--km-ink)' : 'var(--km-line-strong)',
                }}
            >
                {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4L3 6L7 2" stroke="var(--km-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <span className="text-xs" style={{ color: 'var(--km-ink-dim)' }}>{label}</span>
        </div>
    );
}

export default function Listings() {
    const [searchParams] = useSearchParams();
    const [listings, setListings] = useState<ListingCardProps[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [density, setDensity] = useState<'grid' | 'list'>('grid');
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

    const lastListingRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(p => p + 1);
            }
        }, { threshold: 0.1 });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

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
            const response = await axios.get(`${API_URL}/api/listings/filtered`, {
                params: { ...debouncedFilters, page: currentPage, size: 12 },
            });
            const { listings: newListings, totalPages } = response.data;
            setListings(prev => reset ? newListings : [...prev, ...newListings]);
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
        setFilters(prev => ({ ...prev, sortBy, sortDirection }));
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
            <NavBar activePage="listings" />

            <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 56px)' }}>
                {/* Sidebar */}
                <aside
                    className="w-64 flex-shrink-0 sticky top-14 p-6 border-r overflow-y-auto"
                    style={{
                        background: 'var(--km-bg-sub)',
                        borderColor: 'var(--km-line)',
                        height: 'calc(100vh - 56px)',
                        fontSize: '12px',
                    }}
                >
                    <FilterSection label="Search">
                        <input
                            type="text"
                            placeholder="title, brand, model…"
                            value={filters.title}
                            onChange={e => setFilters(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-1.5 rounded border text-xs outline-none"
                            style={{
                                background: 'var(--km-bg)',
                                borderColor: 'var(--km-line)',
                                color: 'var(--km-ink)',
                                fontFamily: 'var(--km-font-mono)',
                            }}
                        />
                    </FilterSection>

                    <FilterSection label="Price">
                        <div className="flex gap-2 mb-3">
                            <div
                                className="flex-1 px-2.5 py-1.5 rounded border text-xs"
                                style={{
                                    background: 'var(--km-bg)',
                                    borderColor: 'var(--km-line)',
                                    color: 'var(--km-ink)',
                                    fontFamily: 'var(--km-font-mono)',
                                }}
                            >
                                ${filters.minPrice}
                            </div>
                            <div
                                className="flex-1 px-2.5 py-1.5 rounded border text-xs"
                                style={{
                                    background: 'var(--km-bg)',
                                    borderColor: 'var(--km-line)',
                                    color: 'var(--km-ink)',
                                    fontFamily: 'var(--km-font-mono)',
                                }}
                            >
                                ${filters.maxPrice}
                            </div>
                        </div>
                        <Slider
                            min={0}
                            max={1000}
                            step={10}
                            value={[filters.minPrice, filters.maxPrice]}
                            onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                            className="[&_[role=slider]]:bg-[var(--km-ink)] [&_.range]:bg-[var(--km-gold)]"
                        />
                    </FilterSection>

                    <FilterSection label="Condition">
                        {CONDITIONS.map(c => (
                            <CheckLine
                                key={c}
                                label={c}
                                checked={filters.condition === c.toLowerCase()}
                                onChange={() => setFilters(prev => ({
                                    ...prev,
                                    condition: prev.condition === c.toLowerCase() ? null : c.toLowerCase(),
                                }))}
                            />
                        ))}
                    </FilterSection>

                    <FilterSection label="Seller">
                        <CheckLine
                            label="Accepts offers"
                            checked={filters.offers === true}
                            onChange={() => setFilters(prev => ({ ...prev, offers: prev.offers === true ? null : true }))}
                        />
                    </FilterSection>

                    <button
                        onClick={() => setFilters({ minPrice: 0, maxPrice: 1000, offers: null, condition: null, title: '', sortBy: 'createdOn', sortDirection: 'desc' })}
                        className="w-full mt-2 py-2 text-xs rounded border text-center transition-colors hover:opacity-80"
                        style={{
                            fontFamily: 'var(--km-font-mono)',
                            color: 'var(--km-gold)',
                            borderColor: 'var(--km-line)',
                            background: 'transparent',
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Clear all filters
                    </button>
                </aside>

                {/* Main content */}
                <section className="flex-1 p-8">
                    {/* Header bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div
                                className="text-xs uppercase tracking-widest mb-1"
                                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '11px' }}
                            >
                                {listings.length > 0 ? `Showing ${listings.length} results` : 'All listings'}
                            </div>
                            <h1
                                className="text-2xl font-semibold tracking-tight"
                                style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}
                            >
                                Browse listings
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Sort */}
                            <Select value={sortValue} onValueChange={handleSortChange}>
                                <SelectTrigger
                                    className="h-8 text-xs border gap-2"
                                    style={{
                                        background: 'var(--km-surface)',
                                        borderColor: 'var(--km-line)',
                                        color: 'var(--km-ink)',
                                        fontFamily: 'var(--km-font-body)',
                                        minWidth: '160px',
                                    }}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)', color: 'var(--km-ink)' }}>
                                    {SORT_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} style={{ color: 'var(--km-ink)' }}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Density toggle */}
                            <div className="flex border rounded overflow-hidden" style={{ borderColor: 'var(--km-line)', background: 'var(--km-surface)' }}>
                                <button
                                    onClick={() => setDensity('grid')}
                                    className="w-8 h-8 flex items-center justify-center transition-colors"
                                    style={{
                                        background: density === 'grid' ? 'var(--km-ink)' : 'transparent',
                                        color: density === 'grid' ? 'var(--km-bg)' : 'var(--km-ink-dim)',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <LayoutGrid size={14} />
                                </button>
                                <button
                                    onClick={() => setDensity('list')}
                                    className="w-8 h-8 flex items-center justify-center transition-colors"
                                    style={{
                                        background: density === 'list' ? 'var(--km-ink)' : 'transparent',
                                        color: density === 'list' ? 'var(--km-bg)' : 'var(--km-ink-dim)',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <List size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Listings */}
                    {density === 'grid' ? (
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {listings.map((listing, i) => (
                                <div key={listing.id} ref={i === listings.length - 1 ? lastListingRef : undefined}>
                                    <ListingCard {...listing} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col border rounded overflow-hidden" style={{ borderColor: 'var(--km-line)' }}>
                            {listings.map((listing, i) => (
                                <a
                                    key={listing.id}
                                    href={`/listings/${listing.id}`}
                                    ref={i === listings.length - 1 ? (lastListingRef as any) : undefined}
                                    className="flex items-center gap-4 px-4 py-3 border-b transition-colors hover:bg-[var(--km-surface-2)]"
                                    style={{ borderColor: 'var(--km-line)', background: 'var(--km-surface)', textDecoration: 'none' }}
                                >
                                    <div
                                        className="w-20 flex-shrink-0 rounded overflow-hidden"
                                        style={{ aspectRatio: '4/3', background: 'var(--km-bg-sub)' }}
                                    >
                                        {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate" style={{ color: 'var(--km-ink)' }}>{listing.title}</div>
                                        <div className="text-xs mt-0.5" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>{listing.condition}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-semibold text-sm" style={{ color: 'var(--km-ink)', fontFamily: 'var(--km-font-mono)' }}>
                                            {listing.price ? `$${parseFloat(listing.price.toFixed(2))}` : 'Open to Offers'}
                                        </div>
                                        {listing.offers && listing.price > 0 && (
                                            <div className="text-xs" style={{ color: 'var(--km-gold)', fontFamily: 'var(--km-font-mono)', fontSize: '10px' }}>OBO</div>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--km-gold)' }} />
                        </div>
                    )}

                    {!loading && !hasMore && listings.length > 0 && (
                        <div
                            className="text-center py-8 text-xs"
                            style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.1em' }}
                        >
                            — end of results —
                        </div>
                    )}

                    {!loading && listings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="text-4xl" style={{ color: 'var(--km-line-strong)' }}>◆</div>
                            <div className="text-sm" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                                No listings found. Try adjusting your filters.
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
