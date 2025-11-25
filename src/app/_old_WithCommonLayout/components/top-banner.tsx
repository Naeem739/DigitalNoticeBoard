import Link from 'next/link'

import { Facebook, Linkedin } from 'lucide-react'
import { AnimatedSentences } from './animated-sentences';



// linear-gradient(to right, rgba(0, 255, 144, .8), rgba(0, 216, 255, .8))


const sentences = [
  "Registration Number: চ-০৯৩০৭",
  "Registration Date: 17/08/2022",
  // "Join us on this exciting journey.",
  // "Innovation is at the heart of what we do.",
  // "Together, we can make a difference."
];

export function TopBanner() {
  return (
    <div
   
    className="w-full h-[40px]  bg-custom-gradient text-white py-2 flex justify-center ">
    {/* <div className="w-full bg-[#98e5d7] text-white py-2"> */}
      <div className="container  max-w-[1200px] flex justify-center md:justify-between items-center text-sm">
        <div className='hidden    md:flex ' > 
          
          {/* Registration Number: চ-০৯৩০৭ */}
          {/* Registration Date: 17/08/2022 */}
          <AnimatedSentences sentences={sentences} interval={4000} />
          
         </div>
        <div className="  flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Mob: +8801323720020</span>

          </div>
          <div className="flex items-center gap-4">
            <Link href="https://www.facebook.com/p/Bandhon-Manobik-Kallyan-Sangstha-100081779846010/" className="hover:text-gray-200">
              <Facebook className="h-4 w-4" />
            </Link>
            {/* <Link href="https://youtube.com/@bandhonmanobikkallyansangstha?si=Y1sx-JmHnAtOo0dE" className="hover:text-gray-200">
              <Youtube className="h-4 w-4" />
            </Link> */}
            <Link href="https://www.linkedin.com/in/bandhon-manobik-kallyan-sangstha-359b58346/
" className="hover:text-gray-200">
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

