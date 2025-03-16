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
            console.log(res.data);
        })
    }, []);
    
    return (
        <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-12 px-48">
                {listings.map((listing) => (
                <ListingCard key={listing.id} {...listing} />
                ))}
            </div>
        </main>
    </div>
    );
}