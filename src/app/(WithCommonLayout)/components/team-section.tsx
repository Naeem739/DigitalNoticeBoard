"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Heart, Facebook, Twitter, LinkedinIcon } from 'lucide-react'
import Image from "next/image"

interface TeamMember {
  name: string
  role: string
  description: string
  image: string
  socials: {
    facebook: string
    twitter: string
    google: string
    linkedin: string
  }
}

const teamMembers: TeamMember[] = [
  {
    name: "Thomas Mendoza",
    role: "Founder",
    description: "Albucius consectetuer eu nam. Saepe legendos vulputate eu quo, id mea comprehensam signifer.",
    image: "/images/placeholder-avatar.jpg",
    socials: {
      facebook: "#",
      twitter: "#",
      google: "#",
      linkedin: "#"
    }
  },
  {
    name: "Magra Mendoza",
    role: "CEO",
    description: "Albucius consectetuer eu nam. Saepe legendos vulputate eu quo, id mea comprehensam signifer.",
    image: "/images/placeholder-avatar.jpg",
    socials: {
      facebook: "#",
      twitter: "#",
      google: "#",
      linkedin: "#"
    }
  },
  {
    name: "Andrew Cruz",
    role: "Developer",
    description: "Albucius consectetuer eu nam. Saepe legendos vulputate eu quo, id mea comprehensam signifer.",
    image: "/images/placeholder-avatar.jpg",
    socials: {
      facebook: "#",
      twitter: "#",
      google: "#",
      linkedin: "#"
    }
  },
  {
    name: "George Silva",
    role: "Designer",
    description: "Albucius consectetuer eu nam. Saepe legendos vulputate eu quo, id mea comprehensam signifer.",
    image: "/images/placeholder-avatar.jpg",
    socials: {
      facebook: "#",
      twitter: "#",
      google: "#",
      linkedin: "#"
    }
  }
]

const SocialIcon = ({ children, href, label }: { children: React.ReactNode; href: string; label: string }) => (
  <motion.a
    href={href}
    className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#00ffff] text-gray-800 transition-all duration-300 ease-in-out hover:bg-white hover:text-[#00ffff] group"
    whileHover={{ 
      scale: 1.1,
      transition: { 
        duration: 0.4,
        ease: "easeInOut"
      }
    }}
    initial={false}
    style={{
      boxShadow: "0 0 0 2px #00ffff"
    }}
    aria-label={label}
  >
    <motion.div
      className="relative z-10"
      whileHover={{ 
        scale: 1.1,
        transition: { duration: 0.2 } 
      }}
    >
      {children}
    </motion.div>
    <motion.div
      className="absolute inset-0 rounded-full bg-white"
      initial={{ scale: 0 }}
      whileHover={{ 
        scale: 1,
        transition: { duration: 0.3 } 
      }}
      style={{ originX: 0.5, originY: 0.5 }}
    />
  </motion.a>
)

export default function TeamSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl font-bold text-[#1e3d6b]">OUR NON-PROFIT TEAM</h2>
            <Heart className="w-6 h-6 text-cyan-500" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <Card key={index} className="overflow-hidden bg-white">
              <CardHeader className="p-0">
                <Image
                  src={member.image}
                  height={165}
                  width={260}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
              </CardHeader>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-[#1e3d6b] mb-2">{member.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{member.description}</p>
                <div className="flex justify-center gap-4">
                  <SocialIcon href={member.socials.facebook} label={`${member.name}'s Facebook`}>
                    <Facebook className="w-5 h-5" />
                  </SocialIcon>
                  <SocialIcon href={member.socials.twitter} label={`${member.name}'s Twitter`}>
                    <Twitter className="w-5 h-5" />
                  </SocialIcon>
                  <SocialIcon href={member.socials.google} label={`${member.name}'s Google`}>
                    <motion.span className="font-bold text-sm">G+</motion.span>
                  </SocialIcon>
                  <SocialIcon href={member.socials.linkedin} label={`${member.name}'s LinkedIn`}>
                    <LinkedinIcon className="w-5 h-5" />
                  </SocialIcon>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

