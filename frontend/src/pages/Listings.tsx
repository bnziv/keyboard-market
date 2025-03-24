import { useEffect, useState } from "react";
import axios from "axios";
import ListingCard, { ListingCardProps } from "@/components/ListingCard";
import NavBar from "@/components/NavBar";
import API_URL from "@/utils/config"

export default function Listings() {
    const [listings, setListings] = useState<ListingCardProps[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/listings/all`).then((res) => {
            setListings(res.data);
        })
    }, []);
    
    return (
        <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1 flex">
                <div className="w-64 p-6 border-r shadow-md">
                    <div className="space-y-6">
                        
                    </div>
                </div>

                <div className="flex-1">
                    <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-12">
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} {...listing} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}