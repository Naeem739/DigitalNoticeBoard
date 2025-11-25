'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cross, Maximize2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface GalleryItem {
  id: number
  src: string
  category: string[]
  alt: string
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    src: "/images/gallery-1.jpg",
    category: ['charity', 'children'],
    alt: "Children smiling and waving at camera"
  },
  {
    id: 2,
    src: "/images/gallery-2.jpg",
    category: ['children', 'nature'],
    alt: "Group of children in colorful clothes outdoors"
  },
  {
    id: 3,
    src: "/images/gallery-3.jpg",
    category: ['children'],
    alt: "Children playing together"
  },
  {
    id: 4,
    src: "/images/gallery-4.jpg",
    category: ['children', 'charity'],
    alt: "Happy children in classroom"
  },
  {
    id: 5,
    src: "/images/gallery-5.jpg",
    category: ['charity', 'food'],
    alt: "Child holding water bottles"
  },
  {
    id: 6,
    src: "/images/gallery-6.jpg",
    category: ['children'],
    alt: "Children laughing together"
  },
  {
    id: 7,
    src: "/images/gallery-7.jpg",
    category: ['charity', 'children'],
    alt: "Children with volunteer"
  },
  {
    id: 8,
    src: "/images/gallery-8.jpg",
    category: ['children', 'charity'],
    alt: "Children studying"
  }
]

const filterOptions = ['All', 'Charity', 'Children', 'Nature', 'Food']

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)

  const filteredItems = galleryItems.filter(item => 
    activeFilter === 'All' || item.category.includes(activeFilter.toLowerCase())
  )

  return (
    <section className=" bg-gray-50 py-16 md:py-24">
    {/* <section className="bg-gray-50 py-16 md:py-24 max-w-[75%] mx-auto "> */}
      <div className="   mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-primary md:text-5xl">
            OUR GALLERY
          </h2>
          <div className="mb-6 flex justify-center">
            <Cross className="h-8 w-8 rotate-45 text-sky-400" />
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo 
            ligula eget dolor. Aenean massa. Cum sociis natoque.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-1 text-sm font-medium transition-colors
                ${activeFilter === filter
                  ? 'bg-primary text-[#26547C]'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                } border border-primary`}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div 
          className=" md:w-[60%] mx-auto  w-full  grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          layout
        >
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-200"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-emerald-500/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-full items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="scale-0 transition-transform duration-300 group-hover:scale-100"
                      onClick={() => setSelectedImage(item)}
                    >
                      <Maximize2 className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl border-none bg-transparent p-0">
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-4 z-50"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  priority
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

