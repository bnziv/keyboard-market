import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface ListingCardProps {
  id: string
  title: string
  price: number
  user: string
  imageUrl: string
}

export default function ListingCard({ id, title, price, user, imageUrl }: ListingCardProps) {
  return (
    <Card className="overflow-hidden ">
      <CardHeader className="p-0">
        <div>
          <img src={imageUrl} alt={title} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="line-clamp-1">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Listed by {user}</p>
        <p className="text-lg font-bold mt-2"></p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}

