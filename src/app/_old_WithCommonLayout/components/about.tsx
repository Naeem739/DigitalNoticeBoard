'use client'
import { useSession } from 'next-auth/react'

export function About() {
  const { data } = useSession();
  console.log(data);
    return (
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-700 mb-4">
            ABOUT-US
          </h2>
          <div className="w-20 h-1 bg-[#98e5d7] mx-auto mb-8" />
          <p className="max-w-2xl mx-auto text-gray-600">
          Bondhon Human Welfare Organization is a non-political and non-profit organization dedicated to community development. The organization is officially registered and recognized by the government, participating actively in social, humanitarian, and environmental initiatives aimed at uplifting marginalized and underprivileged communities. Bondhon is committed to making a meaningful difference by addressing the critical needs of society in a structured and methodical manner.
          </p>
        </div>
      </section>
    )
  }
  
  