import { useEffect, useState } from "react";
import axios from "axios";
import ListingCard, { ListingCardProps } from "@/components/ListingCard";
import NavBar from "@/components/NavBar";
import API_URL from "@/utils/config";
import { Button } from "@/components/ui/button";

interface ListingsResponse {
    listings: ListingCardProps[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export default function Listings() {
    const [listings, setListings] = useState<ListingCardProps[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize, setPageSize] = useState(12);
    const [loading, setLoading] = useState(false);

    const fetchListings = async (page: number) => {
        setLoading(true);
        try {
            const response = await axios.get<ListingsResponse>(`${API_URL}/api/listings/filtered`, {
                params: {
                    page,
                    size: pageSize
                }
            });
            setListings(response.data.listings);
            setCurrentPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch listings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings(currentPage);
    }, [currentPage, pageSize]);

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1 flex">
                <div className="w-64 p-6 border-r shadow-md">
                    <div className="space-y-6">
                        {/* Filters will go here */}
                    </div>
                </div>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <p>Loading listings...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-12">
                                {listings.map((listing) => (
                                    <ListingCard key={listing.id} {...listing} />
                                ))}
                            </div>
                            
                            {/* Pagination controls */}
                            <div className="flex justify-center gap-4 pb-8">
                                <Button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 0}
                                    variant="outline"
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center">
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <Button
                                    onClick={handleNextPage}
                                    disabled={currentPage >= totalPages - 1}
                                    variant="outline"
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}