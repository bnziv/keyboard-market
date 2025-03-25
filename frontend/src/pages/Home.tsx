import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { Link, useNavigate } from "react-router-dom";
import { KeyboardIcon } from "@/components/KeyboardIcon";
import { useAuth } from "@/utils/AuthProvider";
import { useToast } from "@/utils/ToastProvider";
import { useState, useEffect } from "react";

const backgrounds = [
    "/background1.jpg",
    "/background2.jpg",
    "/background3.jpg",
]

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showInfo } = useToast();
  const [currentBackground, setCurrentBackground] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleCreateListing = () => {
    if (isAuthenticated) {
      navigate("/create-listing");
    } else {
      showInfo("You must be logged in to create a listing");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentBackground((prev) => (prev + 1) % backgrounds.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar className="z-50" />
      <main className="flex-1">
        <div className={`absolute inset-0 z-0 transition-all ease-in-out duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
          <img
            src={backgrounds[currentBackground]}
            alt="Keyboard background"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-10rem)] px-4">
          <div className="backdrop-blur-md bg-background/70 dark:bg-background/80 rounded-xl p-12 max-w-4xl mx-auto shadow-lg">
            <div className="flex flex-col items-center text-center space-y-8">
            <div className="flex justify-center items-center w-full">
            <KeyboardIcon className="w-64 text-primary" />
            </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Welcome to Keyboard Market
                </h1>
                <p className="max-w-[700px] md:text-xl">
                  The ultimate marketplace for keyboard enthusiasts. Buy, sell, and discover unique keyboards and parts.
                </p>
              </div>
            <div className="space-x-4 py-4">
              <Button asChild className="text-black bg-gray-200 hover:bg-gray-300">
                <Link to="/listings">Browse Listings</Link>
              </Button>
              <Button className="text-black bg-gray-200 hover:bg-gray-300" onClick={handleCreateListing}>
                Create a Listing
              </Button>
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
