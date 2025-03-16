import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KeyboardIcon } from "@/components/KeyboardIcon"
import { Link } from "react-router-dom"
import { titleCase } from "@/utils/helpers"

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
        <Link to={`/listings/${id}`} className="group">
        <h3 className="truncate group-hover:underline">{title}</h3>
        <div className="flex items-center justify-between mt-2 ">
          <div>
            {price ? (
              <p className="font-medium group-hover:underline">${parseFloat(price.toFixed(2))}</p>
            ) : (
              <p className="font-medium group-hover:underline">Open to Offers</p>
            )}
            {offers && price && <p className="text-sm text-muted-foreground group-hover:underline">Or Best Offer</p>}
          </div>
          <Badge variant="secondary">{condition && titleCase(condition)}</Badge> 
        </div>
        </Link>
      </CardContent>
    </Card>
  )
}
