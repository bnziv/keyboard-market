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
    <Card className="overflow-hidden group">
      <CardHeader className="p-0">
        <Link to={`/listings/${id}`}>
          <div className="h-48 relative">
            {imageUrl ? (
              // Blur background image
              // <>
              //   <div className="absolute inset-0 overflow-hidden">
              //     <img 
              //       src={imageUrl} 
              //       alt={title} 
              //       className="object-cover blur-md scale-110 opacity-50 w-full h-full"
              //     />
              //   </div>
              //   <div className="relative w-full h-full">
              //     <img 
              //       src={imageUrl} 
              //       alt={title} 
              //       className="object-contain w-full h-full"
              //     />
              //   </div>
              // </>
              
              // Cover image
              <div className="relative w-full h-full">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <KeyboardIcon className="p-8" />
              </div>
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link to={`/listings/${id}`} >
        <h3 className="truncate group-hover:underline">{title}</h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {price ? (
              <>
                <p className="text-lg font-medium group-hover:underline">${parseFloat(price.toFixed(2))}</p>
                {offers && <span className="text-sm text-muted-foreground group-hover:underline mt-1">or best offer</span>}
              </>
            ) : (
              <p className="text-lg font-medium group-hover:underline">Open to Offers</p>
            )}
          </div>
          <Badge variant="secondary">{condition && titleCase(condition)}</Badge> 
        </div>
        </Link>
      </CardContent>
    </Card>
  )
}
