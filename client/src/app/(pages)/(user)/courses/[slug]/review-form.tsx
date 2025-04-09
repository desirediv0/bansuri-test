"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export function ReviewForm() {
  const [rating, setRating] = useState(0)

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-2xl font-semibold mb-6">Add a review</h3>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your name*</label>
            <Input placeholder="Enter your name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Your email address*</label>
            <Input type="email" placeholder="Enter your email address" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your rating*</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 cursor-pointer ${
                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your review</label>
          <Textarea placeholder="Your message" rows={6} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="terms" />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I accept the terms and conditions and I have read the privacy policy.
          </label>
        </div>

        <Button type="submit" className="w-full md:w-auto bg-[#ba1c33] text-white hover:bg-[#6d1e2a]">
          Submit review
        </Button>
      </form>
    </div>
  )
}

