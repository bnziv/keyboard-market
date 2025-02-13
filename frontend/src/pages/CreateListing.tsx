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

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        condition: "",
        imageUrl: ""
    })

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({...formData, [e.target.id]: e.target.value})
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log(formData)
    }

    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex flex-col items-center py-12">
          <h1 className="text-3xl font-bold pb-8">Create a New Listing</h1>
          <form className="w-2/5 space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label>Title</Label>
              <Input id="title" placeholder="Enter listing title" value={formData.title} onChange={handleFormChange} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea id="description" placeholder="Describe your item" value={formData.description} onChange={handleFormChange} />
            </div>
            <div className="space-y-3">
              <RadioGroup
                value={priceType}
                onValueChange={function(value) {
                  setPriceType(value)
                  setFormData({...formData, price: value})
                }}
                className="flex items-center justify-between px-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="price" id="price" />
                  <Label>Price</Label>
                  <div className="w-40">
                    <Input
                      id="price"
                      type="number"
                      placeholder={
                        priceType === "price" ? "Enter price in USD" : ""
                      }
                      disabled={priceType !== "price"}
                      onChange={handleFormChange}
                      required={priceType === "price"}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offer" id="price" />
                  <Label>Open to Offers</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Condition</Label>
              <Select required onValueChange={(value) => { setFormData({...formData, condition: value}) }}>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like new">Like New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Images</Label>
              <Input id="imageUrl" type="link" placeholder="Enter imgur link" value={formData.imageUrl} onChange={handleFormChange} />
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

