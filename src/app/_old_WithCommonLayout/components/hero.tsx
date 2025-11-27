'use client'

import dynamic from 'next/dynamic';
import HeroComponent from './hero-component';


  const Hero = dynamic(() => Promise.resolve(HeroComponent), { ssr: false });



export default Hero;





// 'use client'

// import { useState, useEffect } from 'react'
// import Image, { StaticImageData } from 'next/image'
// import { Button } from '@/components/ui/button'
// import { motion, AnimatePresence } from 'framer-motion'
// import { ChevronLeft, ChevronRight } from 'lucide-react'

// import headerImg1 from '/public/images/headerImg_1.jpg';
// import headerImg2 from '/public/images/headerImg_2.jpg';
// import headerImg3 from '/public/images/headerImg_3.jpg';

// interface HeroContent {
//   title: string
//   description: string
//   buttonText: string
//   backgroundImage: string | StaticImageData
// }

// const heroContents: HeroContent[] = [
//   {
//     title: "WE NEED YOUR HELP",
//     description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
//     buttonText: "LEARN MORE",
//     backgroundImage: headerImg1
//     // backgroundImage: '/images/headerImg_1.jpg'
//   },
//   {
//     title: "MAKE A DIFFERENCE TODAY",
//     description: "Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.",
//     buttonText: "GET INVOLVED",
//     backgroundImage: headerImg2
//     // backgroundImage: "/images/headerImg_2.jpg"
//   },
//   {
//     title: "TOGETHER WE CAN CHANGE LIVES",
//     description: "In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi.",
//     buttonText: "DONATE NOW",
//     backgroundImage: headerImg3
//     // backgroundImage: "/images/headerImg_3.jpg"
//   }
// ]




// export default function Hero() {
//   const [currentIndex, setCurrentIndex] = useState(0)
//   const [displayedTitle, setDisplayedTitle] = useState('')
//   const [isMounted, setIsMounted] = useState(false)
//   const currentContent = heroContents[currentIndex]

//   useEffect(() => {
//     setIsMounted(true)
//     const interval = setInterval(() => {
//       nextSlide()
//     }, 8000) // Change content every 8 seconds

//     return () => clearInterval(interval)
//   }, [currentIndex])

//   useEffect(() => {
//     if (isMounted) {
//       let i = 0
//       const typingInterval = setInterval(() => {
//         if (i < currentContent.title.length) {
//           setDisplayedTitle(currentContent.title.slice(0, i + 1))
//           i++
//         } else {
//           clearInterval(typingInterval)
//         }
//       }, 50) // Faster typing speed for smoother animation

//       return () => clearInterval(typingInterval)
//     }
//   }, [currentContent, isMounted])

//   const nextSlide = () => {
//     setCurrentIndex((prevIndex) => (prevIndex + 1) % heroContents.length)
//   }

//   const prevSlide = () => {
//     setCurrentIndex((prevIndex) => (prevIndex - 1 + heroContents.length) % heroContents.length)
//   }

//   if (!isMounted) {
//     return null // or a loading placeholder
//   }

//   return (
//     <section className="relative h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={currentIndex}
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 1.5, ease: "easeInOut" }}
//           className="absolute inset-0"
//         >
//           <Image
//             src={currentContent.backgroundImage || "/placeholder.svg"}
//             alt={`Hero background ${currentIndex + 1}`}
//             layout="fill"
//             objectFit="cover"
//             priority
//           />
//           <div className="absolute inset-0 bg-green-500/30" />
//         </motion.div>
//       </AnimatePresence>
//       <div className="relative container mx-auto px-4 z-10">
//         <motion.h1
//           key={currentContent.title}
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.8, ease: "easeOut" }}
//           className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 h-[120px] flex items-center justify-center"
//         >
//           {displayedTitle}
//         </motion.h1>
//         <motion.p
//           key={currentContent.description}
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
//           className="max-w-2xl mx-auto text-base md:text-lg mb-8"
//         >
//           {currentContent.description}
//         </motion.p>
//         <motion.div
//           key={currentContent.buttonText}
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
//         >
//           <Button className="bg-[#98e5d7] hover:bg-[#7dcdbf] text-white text-lg px-6 py-3 md:px-8 md:py-4 transition-colors duration-300">
//             {currentContent.buttonText}
//           </Button>
//         </motion.div>
//       </div>
//       {/* Left Arrow */}
//       <motion.button
//         onClick={prevSlide}
//         className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-300 z-20"
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         aria-label="Previous slide"
//       >
//         <ChevronLeft className="w-10 h-10" />
//       </motion.button>
//       {/* Right Arrow */}
//       <motion.button
//         onClick={nextSlide}
//         className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-300 z-20"
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         aria-label="Next slide"
//       >
//         <ChevronRight className="w-10 h-10" />
//       </motion.button>
//     </section>
//   )
// }

