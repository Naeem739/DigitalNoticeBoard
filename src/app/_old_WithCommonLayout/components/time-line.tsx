import { Heart } from "lucide-react";
import TimelineItem from "./time-line-item";
export default function Timeline() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="relative flex flex-col gap-16">
        {/* Vertical Line */}
        <div className=" hidden  md:block  absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sky-300" />

        {/* Timeline Items */}
        <div className="relative">
          <TimelineItem
            title="A Few Words About Us"
            content="The organization is focused on assisting a broad 
            spectrum of vulnerable and marginalized groups, which includes
             rural and urban communities, women, men, children, the elderly,
              farmers, livestock owners, fishermen, ethnic minorities, 
              individuals with disabilities, disaster-impacted populations,
               and other socially excluded demographics. Its mission is to
                empower these communities by enhancing resilience and 
                fostering inclusivity."
            //   imageSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-gOqcN6ext3PGUBQkK2rF7W8XVir1Nu.png"
            imageSrc="/images/time-line-item-1.jpg"
            imageAlt="Community gathering"
          />
          <Heart
            className="absolute hidden  md:block  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-sky-300 text-sky-300"
            size={24}
          />
        </div>

        <div className="relative">
          <TimelineItem
            title="Our History"
            content="Since its inception in 2021, Bondhon has been working in rural, semi-urban, and urban areas of Bangladesh with the goal of promoting sustainable development through collective action
              Registration Information
              Registration Number: চ-০৯৩০৭
              Registration Date: 17/08/2022
              Registering Authority: Directorate of Social Welfare, Dhaka
"
            imageSrc="/images/time-line-item-2.jpg"
            imageAlt="Historical moment"
            isReversed
          />
          <Heart
            className="absolute hidden  md:block  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-sky-300 text-sky-300"
            size={24}
          />
        </div>

        <div className="relative">
          <TimelineItem
            title="Our Mission"
            content="With a mission to offer cohesive services in areas like 
                      agricultural support, health services, educational programs, nutritional
                      guidance, sanitation solutions, gender development, environmental initiatives,
                      social security measures, marketing resources, and technical help Bondhon seeks
                      to bolster community engagement to achieve sustainable development. Cultivate
                     a Bangladesh that stands as a beacon of democracy, capability, equality, and free from poverty"
            imageSrc="/images/time-line-item-4.jpg"
            imageAlt="Mission in action"
          />
          <Heart
            className="absolute hidden  md:block  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-sky-300 text-sky-300"
            size={24}
          />
        </div>
        
        <div className="relative">
          <TimelineItem
            title="Goal"
            content="Foster a better quality of life and empower self-sufficiency among disadvantaged groups through comprehensive development projects"
            imageSrc="/images/time-line-item-2.jpg"
            imageAlt="Historical moment"
            isReversed
          />
          <Heart
            className="absolute hidden  md:block  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-sky-300 text-sky-300"
            size={24}
          />
        </div>

        <div className="relative">
          <TimelineItem
            title="Objectives:"
            content={
              <>
                <ul className="list-disc ml-5 mt-2">
                  <li>
                    Provide equitable access to fundamental rights, fostering
                    equity and food security issues for underserved communities.
                  </li>
                  <li>
                    Promote awareness of health and nutrition through medical
                    services and educational campaigns.
                  </li>
                  <li>
                    Foster social cohesion and economic stability by encouraging
                    skills development and sustainable practices.
                  </li>
                  <li>
                    Foster a proactive approach to disaster preparedness and
                    community empowerment.
                  </li>
                  <li>
                    Enable underrepresented individuals to advocate for and
                    safeguard their rights.
                  </li>
                </ul>
              </>
            }
            imageSrc="/images/time-line-item-4.jpg"
            imageAlt="Mission in action"
          />
          <Heart
            className="absolute hidden md:block left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-sky-300 text-sky-300"
            size={24}
          />
        </div>

        <div className="relative">
          <TimelineItem
            title="Core Focus Areas of Development"
            content={
              <>
                <ul className="list-disc ml-5 mt-2">
                  <li>Promoting Sustainable Agriculture and Livelihoods</li>
                  <li>Expanding Access to Education</li>
                  <li>Health Development </li>
                  <li>Community Empowerment and Social Development</li>
                </ul>
              </>
            }
            imageSrc="/images/time-line-item-2.jpg"
            imageAlt="Historical moment"
            isReversed
          />
          <Heart
            className="absolute hidden  md:block  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-sky-300 text-sky-300"
            size={24}
          />
        </div>
      </div>
    </div>
  );
}
