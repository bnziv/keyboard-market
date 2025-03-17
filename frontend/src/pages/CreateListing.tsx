import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/utils/ToastProvider"
import API_URL from "@/utils/config"

export default function CreateListing() {
    const { showError, showSuccess } = useToast()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        condition: "",
        imageUrl: "",
        offers: false
    })

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({...formData, [e.target.id]: e.target.value})
    }

    const validateForm = () => {
      if (!formData.title.trim()) {
        showError("Title cannot be empty")
        return false
      }

      if (!formData.description.trim()) {
        showError("Description cannot be empty")
        return false
      }
      if (formData.description.length > 1000) {
        showError("Description cannot be longer than 1000 characters")
        return false
      }

      if (!formData.offers && !formData.price) {
        showError("Price cannot be empty")
        return false
      }

      if (parseFloat(formData.price) <= 0) {
        showError("Price cannot be negative")
        return false
      }

      if (!formData.condition) {
        showError("Condition cannot be empty")
        return false
      }

      const imgurRegex = /^https?:\/\/(i\.)?imgur\.com\/[a-zA-Z0-9]+(\.jpg|\.jpeg|\.png|\.gif|\.webp)?$/;
      if (formData.imageUrl && !imgurRegex.test(formData.imageUrl)) {
        showError("Invalid image URL")
        return false
      }

      return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) return false

      try {
        const body = {...formData}
        const response = await axios.post(`${API_URL}/api/listings`, body, {
          withCredentials: true
        })

        if (response.status === 201) {
          showSuccess("Listing created successfully!")
          navigate("/listings")
        }
      } catch (error) {
        showError("Failed to create listing")
        console.error(error)
      }
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
              <div className="flex items-center gap-8">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price in USD"
                      onChange={handleFormChange}
                      value={formData.price}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox 
                    id="offers" 
                    checked={formData.offers}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData, 
                        offers: checked as boolean,
                      })
                    }}
                  />
                  <Label htmlFor="offers">Open to Offers</Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Condition</Label>
              <Select onValueChange={(value) => { setFormData({...formData, condition: value}) }}>
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
