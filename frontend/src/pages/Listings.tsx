import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import ListingCard, { ListingCardProps } from "@/components/ListingCard";
import NavBar from "@/components/NavBar";
import API_URL from "@/utils/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2 } from "lucide-react";

interface FilterState {
    minPrice: number;
    maxPrice: number;
    offers: boolean | null;
    condition: string | null;
    title: string;
    sortBy: string;
    sortDirection: string;
}

export default function Listings() {
    const [listings, setListings] = useState<ListingCardProps[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<FilterState>({
        minPrice: 0,
        maxPrice: 1000,
        offers: null,
        condition: null,
        title: "",
        sortBy: "createdOn",
        sortDirection: "desc"
    });
    
    const observer = useRef<IntersectionObserver | null>(null);
    const debouncedFilters = useDebounce(filters, 500);

    const lastListingElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, {
            threshold: 0.1
        });
        if (node) {
            observer.current.observe(node);
        }
    }, [loading, hasMore, page]);

    useEffect(() => {
        setListings([]);
        setPage(0);
        fetchListings(true);
    }, [debouncedFilters]);

    useEffect(() => {
        if (page > 0) {
            fetchListings(false);
        }
    }, [page]);

    const fetchListings = async (resetList: boolean = false) => {
        try {
            setLoading(true);
            const currentPage = resetList ? 0 : page;
            const response = await axios.get(`${API_URL}/api/listings/filtered`, {
                params: {
                    ...debouncedFilters,
                    page: currentPage,
                    size: 12
                }
            });

            const { listings: newListings, totalPages } = response.data;
            
            setListings(prevListings => {
                const updatedListings = resetList ? newListings : [...prevListings, ...newListings];
                return updatedListings;
            });
            setHasMore(currentPage < totalPages - 1);
            
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    };

    const conditions = ["New", "Like New", "Used"];
    const sortOptions = [
        { value: "createdOn", label: "Date Posted" },
        { value: "price", label: "Price" }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <div className="sticky top-0 z-10 bg-white">
            <NavBar />
            </div>
            <main className="flex-1 flex">
                {/* Filter Sidebar */}
                <div className="w-64 p-6 border-r shadow-md sticky top-[69px] h-[calc(100vh-69px)]">
                    <div className="space-y-6">
                        <div>
                            <Label>Search</Label>
                            <Input
                                type="text"
                                placeholder="Search listings..."
                                value={filters.title}
                                onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label>Price Range</Label>
                            <div className="pt-2">
                                <Slider
                                    min={0}
                                    max={1000}
                                    step={10}
                                    value={[filters.minPrice, filters.maxPrice]}
                                    onValueChange={([min, max]) => 
                                        setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))
                                    }
                                />
                                <div className="flex justify-between mt-2">
                                    <span>{filters.minPrice === 0 ? 'Offers' : `$${filters.minPrice}`}</span>
                                    <span>${filters.maxPrice}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Condition</Label>
                            <Select
                                value={filters.condition || "any"}
                                onValueChange={(value) => 
                                    setFilters(prev => ({ 
                                        ...prev, 
                                        condition: value === "any" ? null : value 
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    {conditions.map(condition => (
                                        <SelectItem key={condition} value={condition.toLowerCase()}>
                                            {condition}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Accepts Offers</Label>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    checked={filters.offers === true}
                                    onCheckedChange={(checked) =>
                                        setFilters(prev => ({ ...prev, offers: checked ? true : null }))
                                    }
                                />
                                <span>Show only listings accepting offers</span>
                            </div>
                        </div>

                        <div>
                            <Label>Sort By</Label>
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, sortBy: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    variant={filters.sortDirection === "asc" ? "default" : "outline"}
                                    onClick={() => setFilters(prev => ({ ...prev, sortDirection: "asc" }))}
                                    size="sm"
                                >
                                    Ascending
                                </Button>
                                <Button
                                    variant={filters.sortDirection === "desc" ? "default" : "outline"}
                                    onClick={() => setFilters(prev => ({ ...prev, sortDirection: "desc" }))}
                                    size="sm"
                                >
                                    Descending
                                </Button>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setFilters({
                                    minPrice: 0,
                                    maxPrice: 1000,
                                    offers: null,
                                    condition: null,
                                    title: "",
                                    sortBy: "createdOn",
                                    sortDirection: "desc",
                                });
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Listings Grid */}
                <div className="flex-1">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-12">
                        {listings.map((listing, index) => (
                            <div
                                key={listing.id}
                                ref={index === listings.length - 1 ? lastListingElementRef : undefined}
                            >
                                <ListingCard {...listing} />
                            </div>
                        ))}
                    </div>
                    {loading && (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}