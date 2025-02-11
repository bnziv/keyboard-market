import { Button } from "@/components/ui/button"
import NavBar from "@/components/NavBar"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
            <section className="container py-12 md:py-24 lg:py-32">
            <div className="flex flex-col items-center text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Welcome to Keyboard Market</h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                The ultimate marketplace for keyboard enthusiasts. Buy, sell, and discover unique keyboards and accessories.
                </p>
                <div className="space-x-4">
                <Button>
                    Browse Listings
                </Button>
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
