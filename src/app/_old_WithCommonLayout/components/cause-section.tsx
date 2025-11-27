"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart } from 'lucide-react'
import Image from "next/image"

interface Cause {
  title: string
  description: string
  image: string
}

const causes: Cause[] = [
  {
    title: "Homeless People",
    description: "Li Europan lingues es membres del sam familie. Lor separat existentie es un myth Por scientie, musica, litot.",
    image: "/images/time-line-item-1.jpg"
  },
  {
    title: "Feeding The Hungry",
    description: "Li Europan lingues es membres del sam familie. Lor separat existentie es un myth Por scientie, musica, litot.",
    image: "/images/time-line-item-1.jpg"
  },
  {
    title: "Clean Drinking Water",
    description: "Li Europan lingues es membres del sam familie. Lor separat existentie es un myth Por scientie, musica, litot.",
    image: "/images/time-line-item-1.jpg"
  },
  {
    title: "Child Education",
    description: "Li Europan lingues es membres del sam familie. Lor separat existentie es un myth Por scientie, musica, litot.",
    image: "/images/time-line-item-1.jpg"
  }
]

export default function CausesSection() {
  return (
    <section className="py-16 px-4  bg-[#f4f4f4] ">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-bold text-[#1e3d6b]">OUR CAUSES</h2>
            <Heart className="w-6 h-6 text-cyan-500" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {causes.map((cause, index) => (
            <Card key={index} className="overflow-hidden bg-white">
              <CardHeader className="p-0">
                <Image
                  src={cause.image}
                  width={210}
                  height={160}
                  alt={cause.title}
                  className="w-full h-48 object-cover"
                />
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-[#1e3d6b] mb-4">{cause.title}</h3>
                <p className="text-gray-600 text-sm">{cause.description}</p>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <motion.button
                  className="w-full bg-[#00ffff] hover:bg-[#00e6e6] text-black font-medium py-2 rounded-full transition-colors"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0px 5px 15px rgba(0, 255, 255, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 10
                  }}
                >
                  DONATE NOW
                </motion.button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

