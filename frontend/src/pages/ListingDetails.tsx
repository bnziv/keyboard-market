import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Heart, Share2 } from "lucide-react"
import { useToast } from "@/utils/ToastProvider"
import { formatDate, titleCase } from "@/utils/helpers"
import API_URL from "@/utils/config"
import { ChatManager } from '@/components/ChatManager'
import { useAuth } from "@/utils/AuthProvider"
import { Chat } from "@/components/Chat"
import { useChat } from '@/utils/ChatProvider'

interface Listing {
    id: string,
    title: string,
    price: number,
    offers: boolean,
    description: string,
    condition: string,
    imageUrl: string,
    seller: {
        id: string,
        username: string,
        dateJoined: string,
        totalListings: number
    },
    createdOn: string,
}

export default function ListingDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const { showInfo, showError } = useToast()
    const [listing, setListing] = useState<Listing>({} as Listing)
    const [loading, setLoading] = useState(true)
    const { user, isAuthenticated } = useAuth()
    const { startChat } = useChat()

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await fetch(`${API_URL}/api/listings/details/${id}`)
                const data = await response.json()
                setListing(data)
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
            showError("Please login to contact the seller")
            return
        }
        if (user?.id === listing.seller.id) {
            showInfo("This is your own listing")
            return
        }
        startChat(listing.seller.id, listing.seller.username)
    }

    const toggleFavorite = () => {
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        showInfo("Link copied to clipboard")
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
            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 w-3/4 mx-auto">
                <div className="mb-6">
                    <Link to="/listings" className="text-primary hover:underline">
                        &larr; Listings
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left column - Images */}
                    <div className="space-y-4">
                    {listing.imageUrl && (
                        <div className="rounded-lg overflow-hidden border bg-background">
                            <div className="relative w-full">
                                <div className="absolute inset-0 overflow-hidden items">
                                    <img
                                        src={listing.imageUrl}
                                        className="object-cover blur-md scale-110 opacity-50 w-full h-full"
                                    />
                                </div>
                                <div className="relative w-full">
                                    <img
                                        src={listing.imageUrl}
                                        alt={listing.title}
                                        className="object-contain w-full h-full max-h-[550px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${listing.seller.username}&backgroundType=gradientLinear`} />
                                        <AvatarFallback>{listing.seller.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-lg">{listing.seller.username}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {listing.seller.dateJoined && `Joined ${formatDate(listing.seller.dateJoined)}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    {/* <div>
                                        <p className="text-sm text-muted-foreground">Rating</p>
                                        <p className="font-medium">{listing.seller.rating} / 5</p>
                                    </div> */}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Listings</p>
                                        <p className="font-medium">{listing.seller.totalListings}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                className="flex-1 contact-seller-button" 
                                size="lg" 
                                onClick={handleContactSeller}
                            >
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Contact Seller
                            </Button>

                            {listing.offers ? (
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
                                <Badge variant="secondary">{titleCase(listing.condition)}</Badge>
                                <span className="text-muted-foreground text-sm">
                                    {listing.createdOn && `Listed on ${formatDate(listing.createdOn)}`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                {listing.price ? (
                                    <p className="text-3xl font-bold">${parseFloat(listing.price.toFixed(2))}</p>
                                ) : (
                                    <p className="text-3xl font-bold">Open to Offers</p>
                                )}
                                {listing.price && listing.offers && <p className="text-muted-foreground text-md">or Best Offer</p>}
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleFavorite}
                                    className={true ? "text-red-500" : ""}
                                >
                                    <Heart className={true ? "fill-current" : ""} />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleShare}>
                                    <Share2 />
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
                                    <div>{titleCase(listing.condition)}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
