import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/utils/ToastProvider"
import { useAuth } from "@/utils/AuthProvider"
import axios from "axios"
import { DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function LoginForm() {
  const { showError, showSuccess } = useToast()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("login")
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    username: "",
    email: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value})
  }

  const validateForm = () => {
    if (activeTab === "login") {
      if (!formData.identifier.trim()) {
        showError("Email/Username cannot be empty")
        return false
      }

      if (!formData.password.trim()) {
        showError("Password cannot be empty")
        return false
      }
    } else {
      if (!formData.email.trim()) {
        showError("Email cannot be empty")
        return false
      }

      if (!formData.username.trim()) {
        showError("Username cannot be empty")
        return false
      }

      if (!formData.password.trim()) {
        showError("Password cannot be empty")
        return false
      }

      if (!formData.confirmPassword.trim()) {
        showError("Confirm password cannot be empty")
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        showError("Passwords do not match")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return false

    if (activeTab === "login") {
      try {
        const response = await axios.post(`/api/auth/login`, 
          {
            identifier: formData.identifier,
            password: formData.password
          },
          { withCredentials: true }
        )

        if (response.status === 200) {
          login(response.data)
          showSuccess("Login successful")
        }
      } catch (error: any) {
        if (error.response?.data) {
          showError(error.response.data.error)
        } else {
          showError("Failed to login")
        }
      }
    } else {
      try {
        const response = await axios.post(`/api/auth/register`, 
            {
              email: formData.email,
              username: formData.username,
              password: formData.password
            },
            { withCredentials: true }
          )
  
          if (response.status === 200) {
            login(response.data)
            showSuccess("Registration successful")
            setTimeout(() => navigate("/listings"), 2000)
          }
        } catch (error: any) {
          if (error.response?.data) {
            showError(error.response.data.error || "Failed to register")
          } else {
            showError("Failed to register")
          }
        }
    }
  }

  return (
    <>
    <DialogTitle/>
    <DialogDescription/> {/* To avoid errors */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Email/Username</Label>
              <Input name="identifier" placeholder="Enter your email or username" 
              onChange={handleChange} value={formData.identifier} />
            </div>
            <div>
              <Label>Password</Label>
              <Input name="password" type="password" placeholder="Enter your password"
              onChange={handleChange} value={formData.password} />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="register">
        <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="Enter your email" 
                onChange={handleChange} value={formData.email} />
              </div>
              <div>
                <Label>Username</Label>
                <Input name="username" placeholder="Enter your username"
                onChange={handleChange} value={formData.username} />
              </div>
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" placeholder="Create a password"
                onChange={handleChange} value={formData.password} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input name="confirmPassword" type="password" placeholder="Confirm your password"
                onChange={handleChange} value={formData.confirmPassword} />
              </div>
              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>
        </TabsContent>
      </Tabs>
    </>
  )
} 