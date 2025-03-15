import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
// import { format } from "date-fns"
// import Image from "next/image"
// import Link from "next/link"
import { Link } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Heart, Share2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/utils/AuthProvider"

// Mock data for demonstration purposes
const mockListing = {
    id: "1",
    title: "Custom Mechanical Keyboard with Cherry MX Brown Switches",
    price: 250,
    priceType: "fixed", // 'fixed' or 'offer'
    condition: "Like New",
    offers: true,
    description: `A beautifully crafted custom mechanical keyboard with Cherry MX Brown switches, PBT keycaps, and a solid aluminum case. Perfect for both typing and gaming.
    
    Features:
    - Cherry MX Brown switches (tactile, not clicky)
    - PBT double-shot keycaps with a clean minimal design
    - Solid aluminum case with a brushed finish
    - Hot-swappable PCB for easy switch replacement
    - RGB backlighting with multiple effects
    - USB-C detachable cable
    - Fully programmable with QMK firmware
    
    The keyboard has been lightly used for about 2 months. No scratches or damage. Comes in the original packaging with all accessories.
  `,
    images: [
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
    ],
    seller: {
        id: "101",
        username: "KeyboardEnthusiast",
        avatarUrl: "/placeholder.svg?height=50&width=50",
        dateJoined: new Date("2022-01-15"),
        rating: 4.8,
        totalSales: 27,
    },
    createdAt: new Date("2023-11-20"),
    location: "San Francisco, CA",
    shipping: "Free shipping",
    views: 142,
}

export default function ListingDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const { isAuthenticated } = useAuth()
    const [listing, setListing] = useState(mockListing)
    const [loading, setLoading] = useState(true)
    const [isFavorite, setIsFavorite] = useState(false)

    // In a real application, you would fetch the listing data based on the id
    useEffect(() => {
        // Simulate API call
        const fetchListing = async () => {
            try {
                // In a real app, you would fetch data from your API
                // const response = await fetch(`/api/listings/${id}`)
                // const data = await response.json()
                // setListing(data)

                // For now, we'll use our mock data
                setListing(mockListing)
                setLoading(false)
            } catch (error) {
                console.error("Error fetching listing:", error)
                setLoading(false)
            }
        }

        fetchListing()
    }, [id])

    const handleContactSeller = () => {
        if (!isAuthenticated) {
            toast.error("Please log in to contact the seller", {
                description: "You need to be logged in to send messages",
                action: {
                    label: "Login",
                    onClick: () => (window.location.href = "/login"),
                },
            })
            return
        }

        // In a real app, you would implement messaging functionality
        toast.success("Message sent to seller!", {
            description: "The seller will respond to your inquiry soon.",
        })
    }

    const toggleFavorite = () => {
        if (!isAuthenticated) {
            toast.error("Please log in to save listings", {
                description: "You need to be logged in to save listings to your favorites",
                action: {
                    label: "Login",
                    onClick: () => (window.location.href = "/login"),
                },
            })
            return
        }

        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? "Removed from favorites" : "Added to favorites")
    }

    const handleShare = () => {
        // Copy the current URL to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
    }

    const handleReport = () => {
        toast.info("Report submitted", {
            description: "Thank you for helping keep our marketplace safe.",
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <NavBar />
                <main className="flex-1 container py-12 flex items-center justify-center">
                    <p>Loading listing details...</p>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col scrollbar-gutter">
            <NavBar />
            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 mx-auto max-w-[1600px]">
                <div className="mb-6">
                    <Link to="/listings" className="text-primary hover:underline">
                        &larr; Listings
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-2 mx-auto w-full">
                    {/* Left column - Images */}
                    <div className="space-y-4">
                        <div className="rounded-lg overflow-hidden border bg-background">
                            <div className="relative w-full">
                                <div className="absolute inset-0 overflow-hidden items">
                                    <img
                                        src={"https://i.imgur.com/J8qPVz1.jpeg"}
                                        className="object-cover blur-md scale-110 opacity-50 w-full h-full"
                                    />
                                </div>
                                <div className="relative w-full">
                                    <img
                                        src={"https://i.imgur.com/J8qPVz1.jpeg" || "https://i.imgur.com/J8qPVz1.jpeg"}
                                        alt={listing.title}
                                        className="object-contain w-full h-full max-h-[700px]"
                                    />
                                </div>
                            </div>
                        </div>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={listing.seller.avatarUrl} alt={listing.seller.username} />
                                        <AvatarFallback>{listing.seller.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-lg">{listing.seller.username}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Joined {/*format(listing.seller.dateJoined, "MMMM yyyy")*/}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rating</p>
                                        <p className="font-medium">{listing.seller.rating} / 5</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Sales</p>
                                        <p className="font-medium">{listing.seller.totalSales}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button className="flex-1" size="lg" onClick={handleContactSeller}>
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Contact Seller
                            </Button>

                            {listing.priceType === "fixed" ? (
                                <Button variant="outline" className="flex-1" size="lg">
                                    Make Offer
                                </Button>
                            ) : (
                                <Button variant="outline" className="flex-1" size="lg">
                                    Submit Offer
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right column - Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">{listing.title}</h1>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{listing.condition}</Badge>
                                <span className="text-muted-foreground text-sm">
                                    Listed on {/*format(listing.createdAt, "MMMM d, yyyy")*/}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                {listing.priceType === "fixed" ? (
                                    <p className="text-3xl font-bold">${listing.price.toFixed(2)}</p>
                                ) : (
                                    <p className="text-3xl font-bold">Open to Offers</p>
                                )}
                                {listing.offers && <p className="text-muted-foreground">Or Best Offer</p>}
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleFavorite}
                                    className={isFavorite ? "text-red-500" : ""}
                                >
                                    <Heart className={isFavorite ? "fill-current" : ""} />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleShare}>
                                    <Share2 />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleReport}>
                                    <AlertCircle />
                                </Button>
                            </div>
                        </div>


                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="whitespace-pre-line">{listing.description}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Condition</div>
                                    <div>{listing.condition}</div>

                                    <div className="text-muted-foreground">Location</div>
                                    <div>{listing.location}</div>

                                    <div className="text-muted-foreground">Shipping</div>
                                    <div>{listing.shipping}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
