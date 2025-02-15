"use client"

import { useState } from "react"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (activeTab === "login") {

    } else {

    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-md mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form className="space-y-4">
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
            <form className="space-y-4">
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

