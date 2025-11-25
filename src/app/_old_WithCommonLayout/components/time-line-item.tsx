import Image from "next/image"
import { ReactNode } from "react"
// import { Heart } from 'lucide-react'

interface TimelineItemProps {
  title: string
  content: string | ReactNode
  imageSrc: string
  imageAlt: string
  isReversed?: boolean
}

export default function TimelineItem({ title, content, imageSrc, imageAlt, isReversed = false }: TimelineItemProps) {
  return (
    <div className="relative md:w-[63%] mx-[auto] flex items-center justify-center gap-8 md:justify-between">
      {/* Content Section */}
      <div className={`w-full md:w-[45%]  ${isReversed ? 'md:order-2' : ''}`}>
        <div className=" md:max-w-[350px]  ">
            <h2 className="mb-4 text-xl font-semibold text-[#26547c]">{title}</h2>
            <p className="text-muted-foreground text-[#999999]">{content}</p>

        </div>
       
      </div>
      
      {/* Image Section */}
      <div className={`hidden w-[45%] md:block ${isReversed ? 'md:order-1' : ''}`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={400}
          height={270}
     
          className="rounded-lg object-cover  "
        />
      </div>
    </div>
  )
}

