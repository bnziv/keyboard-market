import { Button } from "@/components/ui/button"
import NavBar from "@/components/NavBar"
import { Link } from "react-router-dom"
import { KeyboardIcon } from "@/components/KeyboardIcon"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
            <section className="py-6 md:py-18 lg:py-18">
            <div className="flex flex-col items-center text-center space-y-8">
                <KeyboardIcon className="w-28 h-12 md:w-42 md:h-18 lg:w-56 lg:h-24"/>
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Welcome to Keyboard Market</h1>
                    <p className="max-w-[700px] text-muted-foreground md:text-xl">
                    The ultimate marketplace for keyboard enthusiasts. Buy, sell, and discover unique keyboards and accessories.
                    </p>
                </div>
                <div className="space-x-4 py-4">
                <Link to="/listings">
                    <Button>Browse Listings</Button>
                </Link>
                <Button variant="outline">
                    Create a Listing
                </Button>
                </div>
            </div>
            </section>
        </main>
    </div>
  )
}
