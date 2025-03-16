import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KeyboardIcon } from "@/components/KeyboardIcon"
import { Link } from "react-router-dom"

export interface ListingCardProps {
  id: string
  title: string
  price: number
  offers: boolean
  condition: string
  imageUrl?: string
}

export default function ListingCard({ id, title, price, offers, condition, imageUrl }: ListingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Link to={`/listings/${id}`}>
          <div className="h-48 relative">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={title} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <KeyboardIcon className="p-16" />
              </div>
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link to={`/listings/${id}`} className="hover:underline">
        <h3 className="truncate">{title}</h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            {price ? (
              <p className="font-medium">${price.toFixed(2)}</p>
            ) : (
              <p className="font-medium">Open to Offers</p>
            )}
            {offers && price && <p className="text-sm text-muted-foreground">Or Best Offer</p>}
          </div>
          <Badge variant="secondary">{condition}</Badge>
        </div>
        </Link>
      </CardContent>
    </Card>
  )
}
