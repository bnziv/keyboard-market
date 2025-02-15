import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyboardIcon } from "@/components/KeyboardIcon"
import { Link } from "react-router-dom"

export interface ListingCardProps {
  id: string
  title: string
  price: number
  user: string
  imageUrl: string
}

export default function ListingCard({ id, title, price, user, imageUrl }: ListingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Link to={`/listings/${id}`}>
          <div> {/* TODO: Fix resizing */}
            {imageUrl && <img src={imageUrl} alt={title} />}
            {!imageUrl && <KeyboardIcon className="p-8" />}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link to={`/listings/${id}`} className="hover:underline">
          <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">Listed by {user}</p>
          <p className="text-lg font-bold mt-2">{price}</p>
        </Link>
      </CardContent>
    </Card>
  )
}

