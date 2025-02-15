"use client"

import { useState } from "react"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toastError, toastSuccess } from "@/lib/Toast"
import { Toaster } from "@/components/ui/sonner"
import axios from "axios"

export default function Login() {
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
        toastError("Email/Username cannot be empty")
        return false
      }

      if (!formData.password.trim()) {
        toastError("Password cannot be empty")
        return false
      }
    } else {
      if (!formData.email.trim()) {
        toastError("Email cannot be empty")
        return false
      }

      if (!formData.username.trim()) {
        toastError("Username cannot be empty")
        return false
      }

      if (!formData.password.trim()) {
        toastError("Password cannot be empty")
        return false
      }

      if (!formData.confirmPassword.trim()) {
        toastError("Confirm password cannot be empty")
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        toastError("Passwords do not match")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return false

    if (activeTab === "login") { // Login
      try {
        const response = await axios.post("http://localhost:8080/api/auth/login", 
          {
            identifier: formData.identifier,
            password: formData.password
          }
        )

        if (response.status === 200) {
          const token = response.data
          localStorage.setItem("jwt", token)
          toastSuccess("Login successful")
          setTimeout(() => window.location.href = "/listings", 2000)
        }
      } catch (error: any) {
        if (error.response?.data) {
          toastError(error.response.data.error)
        } else {
          toastError("Failed to login")
        }
      }
    } else { // Register
      try {
        const response = await axios.post("http://localhost:8080/api/auth/register", 
          {
            email: formData.email,
            username: formData.username,
            password: formData.password
          }
        )

        if (response.status === 200) {
          toastSuccess("Registration successful")
          setTimeout(() => window.location.href = "/login", 2000)
        }
      } catch (error: any) {
        if (error.response?.data) {
          toastError(error.response.data.error)
        } else {
          toastError("Failed to register")
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster duration={3000} position="top-center"/>
      <NavBar />
      <main className="flex-1 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-md mx-auto">
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
                <Input name="username" placeholder="Enter your email"
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
      </main>
    </div>
  )
}

