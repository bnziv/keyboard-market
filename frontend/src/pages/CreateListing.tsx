import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"

export default function CreateListing() {
    const [priceType, setPriceType] = useState("price")

    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex flex-col items-center py-12">
          <h1 className="text-3xl font-bold pb-8">Create a New Listing</h1>
          <form className="w-2/5 space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter listing title" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your item" />
            </div>
            <div className="space-y-3">
              <RadioGroup
                value={priceType}
                onValueChange={setPriceType}
                className="flex items-center justify-center space-x-32"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price" />
                  <Label htmlFor="price">Price</Label>
                  <div className="w-40">
                    <Input
                      id="price"
                      type="number"
                      placeholder={
                        priceType === "price" ? "Enter price in USD" : ""
                      }
                      disabled={priceType !== "price"}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offer" id="offer" />
                  <Label htmlFor="offer">Open to Offers</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="images">Images</Label>
              <Input id="images" type="link" placeholder="Enter imgur link" />
            </div>
            <div className="flex justify-center">
              <Button type="submit" className="mx-auto">
                Create Listing
              </Button>
            </div>
          </form>
        </main>
      </div>
    );
}

