'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Cross } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Testimonial {
  id: number
  name: string
  role: string
  image: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Jordan Nichols",
    role: "Charity Founder",
    image: "/images/placeholder-avatar.jpg",
    quote: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem."
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Community Leader",
    image: "/images/placeholder-avatar.jpg",
    quote: "Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu."
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "Volunteer Director",
    image: "/images/placeholder-avatar.jpg",
    quote: "Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus."
  }
]

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-cyan-400 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            TESTIMONIAL
          </h2>
          <div className="mb-6 flex justify-center">
            <Cross className="h-8 w-8 rotate-45 text-white/80" />
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mb-8 flex justify-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/20">
                  <Image
                    src={testimonials[currentIndex].image}
                    alt={testimonials[currentIndex].name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <blockquote className="mb-8">
                <p className="text-lg text-white md:text-xl">
                  {testimonials[currentIndex].quote}
                </p>
              </blockquote>
              <div className="text-center">
                <cite className="not-italic">
                  <span className="block text-xl font-semibold text-white">
                    {testimonials[currentIndex].name}
                  </span>
                  <span className="text-sm text-white/80">
                    {testimonials[currentIndex].role}
                  </span>
                </cite>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-center gap-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white scale-100'
                    : 'bg-white/50 scale-90 hover:bg-white/70'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

