'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from 'lucide-react'

export default function Footer() {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
  }

  return (
    <footer className="bg-[#2f3337] text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Address Column */}
          <div>
            <h3 className="text-white font-semibold mb-6">ADDRESS</h3>
            <div className="space-y-3">
              <p className="flex items-start">
                {/* <span className="mr-2">📍</span> */}
                House: 303/E, Road 02<br /> Baitul Aman Housing Society <br/ >
                Adabor, Dhaka 1207 <br /> +88 0132 2372 0020
              </p>
              <p className="flex items-center">
                {/* <span className="mr-2">Brunch</span> */}
                {/* Branches: <br/>
                  •	Bandhon MKS Mirpur <br/>
                  House: 97(Amena’s Dream), Flat 2 (A)<br/>
                  Borobag Kacha Bazar, Mirpur- 2, Dhaka 1216<br/>
                  + 88 017 6052 4307 */}

              </p>
              <p className="flex items-center">
                {/* <span className="mr-2">✉️</span> */}
                {/* •	Bandhon MKS Mohammadpur<br/>
                    Khanom Minjeel, House- 19/4 (2nd Floor)<br/>
                    Azam Road, Block-D (Beside NRBC BANK Building) <br/>
                    Mohammadpur, Dhaka 1207 <br/> */}

              </p>
            </div>
          </div>

          {/* Links Column */}
          <div>
            {/* <h3 className="text-white font-semibold mb-6">LINKS</h3>
            <nav className="space-y-3">
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Our donors</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Events</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Forums</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Blog</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Press release</a>
            </nav> */}
             <h3 className="text-white font-semibold mb-6">Branches</h3>
            <p className="flex items-center">
                {/* <span className="mr-2">Branches:</span> */}
               
                  •	Bandhon MKS Mirpur <br/>
                  House: 97(Amena’s Dream), Flat 2 (A)<br/>
                  Borobag Kacha Bazar, Mirpur- 2, Dhaka 1216<br/>
                  + 88 017 6052 4307

              </p>
              <p className="flex items-center mt-2">
                {/* <span className="mr-2">✉️</span> */}
                •	Bandhon MKS Mohammadpur<br/>
                    Khanom Minjeel, House- 19/4 (2nd Floor)<br/>
                    Azam Road, Block-D (Beside NRBC BANK Building) <br/>
                    Mohammadpur, Dhaka 1207 <br/>

              </p>
          </div>

          {/* Our Pages Column */}
          <div>
            <h3 className="text-white font-semibold mb-6">OUR PAGES</h3>
            <nav className="space-y-3">
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">About us</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Latest news</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Privacy policy</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Terms and conditions</a>
              <a href="#" className="block hover:text-[#00ffd5] transition-colors">Contact us</a>
            </nav>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-white font-semibold mb-6">SUBSCRIBE NEWSLETTER</h3>
            <p className="mb-4">Get the latest update from us by subscribing to our newsletter.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Write your mail"
                className="bg-gray-600/50 border-0 focus-visible:ring-[#00ffd5] text-white placeholder:text-gray-400"
              />
              <Button 
                type="submit" 
                size="icon"
                className="bg-[#00ffd5] hover:bg-[#00ffd5]/90 text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Copyright Bar */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-center">
            © Bandhon. | All rights reserved | Built by The Cheifs
          </p>
        </div>
      </div>
    </footer>
  )
}

