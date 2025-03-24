import { useState, useEffect } from "react"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import ListingCard, { ListingCardProps } from "@/components/ListingCard"
import { Heart, Star, Package, MessageCircle } from "lucide-react"
import { useParams } from "react-router-dom"
import axios from "axios"
import API_URL from "@/utils/config"
import { useChat } from "@/utils/ChatProvider"
import { useAuth } from "@/utils/AuthProvider"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/utils/ToastProvider"
import { formatDate } from "@/utils/helpers"

interface UserProps {
  id: string,
  username: string,
  dateJoined: string,
  totalListings: number,
  rating: number,
  reviewCount: number,
  favoriteCount: number
}

export default function Profile() {
  const params = useParams()
  const username = params.username
  const [activeTab, setActiveTab] = useState("listings")
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProps>({} as UserProps);
  const [userListings, setUserListings] = useState<ListingCardProps[]>([]);
  const { user, isAuthenticated } = useAuth();
  const { startChat } = useChat();
  const { showError, showInfo } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/api/users/profile/${username}`).then((res) => {
      setUserData(res.data);
    })
    axios.get(`${API_URL}/api/listings/username/${username}`).then((res) => {
        setUserListings(res.data);
    })
    setLoading(false);
  }, [username]);

  const handleMessage = () => {
    if (!isAuthenticated) {
      showError("Please login to start a chat")
      return
    }
    if (user?.id === userData.id) {
      showInfo("This is your own profile")
      return
    }
    startChat(userData.id, userData.username)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 container py-12 flex items-center justify-center">
          <p>Loading profile...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4 w-32 h-32">
                  <Avatar className="h-32 w-32">
                    <AvatarImage
                      src={`https://api.dicebear.com/9.x/initials/svg?seed=${userData.username}&backgroundType=gradientLinear`}
                    />
                    <AvatarFallback>{userData.username}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{userData.username}</CardTitle>
                <CardDescription>Member since {formatDate(userData.dateJoined)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-bold">{userData.rating}</p>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {userData.totalListings}
                    </p>
                    <p className="text-sm text-muted-foreground">Listings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userData.reviewCount}</p>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {userData.favoriteCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <nav className="space-y-2">
                  <Button
                    variant={activeTab === "listings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("listings")}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Listings
                  </Button>
                  <Button
                    variant={activeTab === "favorites" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("favorites")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </Button>
                  <Button
                    variant={activeTab === "reviews" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("reviews")}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Reviews
                  </Button>
                </nav>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-500 hover:bg-blue-600" size="lg" onClick={handleMessage}>
                  <MessageCircle className="h-5 w-5" />
                  Messsage
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="listings" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>{userData.username}'s Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {userListings.map((listing) => (
                        <ListingCard key={listing.id} {...listing} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>{userData.username}'s Favorites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        No favorites yet
                      </h3>
                      <Button
                        className="mt-4"
                        onClick={() => navigate("/listings")}
                      >
                        Browse Listings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>{userData.username}'s Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mr-4">
                            <Star className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {userData.rating} out of 5
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Based on {userData.reviewCount} reviews
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(userData.rating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No reviews to display yet.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}