'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react'

// import dynamic from 'next/dynamic';
// import img1 from "../../../assets/headerImg_1.jpg";
import { StaticImageData } from 'next/image';
import headerImg1 from '/public/images/compressed/headerImg_1.jpg';
import headerImg2 from '/public/images/compressed/headerImg_2.jpg';
import headerImg3 from '/public/images/compressed/headerImg_3.jpg';

interface HeroContent {
  title: string
  description: string
  buttonText: string
  backgroundImage: string | StaticImageData
}

const heroContents: HeroContent[] = [
  {
    title: "WE NEED YOUR HELP",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
    buttonText: "LEARN MORE",
    backgroundImage: headerImg1
    // backgroundImage: '/images/headerImg_1.jpg'
  },
  {
    title: "MAKE A DIFFERENCE TODAY",
    description: "Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.",
    buttonText: "GET INVOLVED",
    backgroundImage: headerImg2
    // backgroundImage: "/images/headerImg_2.jpg"
  },
  {
    title: "TOGETHER WE CAN CHANGE LIVES",
    description: "In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi.",
    buttonText: "DONATE NOW",
    backgroundImage: headerImg3
    // backgroundImage: "/images/headerImg_3.jpg"
  }
]


 export default function HeroComponent() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [displayedTitle, setDisplayedTitle] = useState('')
    const currentContent = heroContents[currentIndex]
  
    useEffect(() => {
      const interval = setInterval(() => {
        nextSlide()
      }, 8000) // Change content every 8 seconds
  
      return () => clearInterval(interval)
    }, [currentIndex])
  
    useEffect(() => {
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < currentContent.title.length) {
          setDisplayedTitle(currentContent.title.slice(0, i + 1))
          i++
        } else {
          clearInterval(typingInterval)
        }
      }, 100) // Adjust typing speed here
   
      return () => clearInterval(typingInterval)
    }, [currentContent])
  
    const nextSlide = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroContents.length)
    }
  
    const prevSlide = () => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + heroContents.length) % heroContents.length)
    }
  
    return (
      <section className="relative h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${(currentContent.backgroundImage as StaticImageData).src})`,
            }}
          >
            <div className="absolute inset-0 bg-green-500/30" /> {/* Green overlay */}
          </motion.div>
        </AnimatePresence>
        <div className="relative container mx-auto px-4">
          <motion.h1
            key={currentContent.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 h-[120px] flex items-center justify-center"
          >
            {displayedTitle}
          </motion.h1>
          <motion.p
            key={currentContent.description}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base md:text-lg mb-8"
          >
            {currentContent.description}
          </motion.p>
          <motion.div
            key={currentContent.buttonText}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <Button className="bg-[#98e5d7] hover:bg-[#7dcdbf] text-white text-lg px-6 py-3 md:px-8 md:py-4">
              {currentContent.buttonText}
            </Button>
          </motion.div>
        </div>
        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 transition-colors rounded-full p-2"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 transition-colors rounded-full p-2"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>
    )
  }

//   export default Hero;
  
  

