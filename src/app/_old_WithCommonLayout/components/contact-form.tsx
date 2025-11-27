'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-[#1e3d6b] mb-4">GET IN TOUCH</h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-[2px] w-12 bg-[#1e3d6b]/20" />
          <div className="text-[#1e3d6b]/40">✦</div>
          <div className="h-[2px] w-12 bg-[#1e3d6b]/20" />
        </div>
        <p className="text-gray-500 max-w-xl mx-auto">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Name"
            className="bg-gray-100 border-0 h-12"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            type="email"
            placeholder="Email"
            className="bg-gray-100 border-0 h-12"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Write your message here"
          className="bg-gray-100 border-0 min-h-[200px]"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        />
        <div className="flex justify-center">
          <Button 
            type="submit"
            className="bg-[#00ffd5] relative overflow-hidden group text-black px-8 py-6 h-auto rounded-full font-medium transition-colors duration-300"
          >
            <span className="relative z-10">SEND MESSAGE</span>
            <div className="absolute inset-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </Button>
        </div>
      </form>
    </div>
  )
}

