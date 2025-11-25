'use client'

import { Heart, Cross, Home, DollarSign } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface StatProps {
  icon: React.ReactNode
  label: string
  value: number
  duration?: number
}

function AnimatedStat({ icon, label, value, duration = 2000 }: StatProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const step = Math.ceil(value / (duration / 16))
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current > value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(current)
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration, isVisible])

  return (
    <div ref={ref} className="flex flex-col items-center space-y-2">
      <div className="rounded-full bg-white/20 p-4">
        {icon}
      </div>
      <p className="text-sm font-medium uppercase tracking-wider text-white/90">
        {label}
      </p>
      <p className="text-3xl font-bold text-white md:text-4xl">
        {count.toLocaleString()}
      </p>
    </div>
  )
}

export default function SuccessStories() {
  const stats = [
    { icon: <Heart className="h-6 w-6 text-white" />, label: "Donate Heart", value: 6850 },
    { icon: <Cross className="h-6 w-6 text-white" />, label: "Save Life", value: 1556 },
    { icon: <Home className="h-6 w-6 text-white" />, label: "Donate Houses", value: 6445 },
    { icon: <DollarSign className="h-6 w-6 text-white" />, label: "Donate Money", value: 12000 },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-cyan-400 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            SUCCESS STORIES
          </h2>
          <div className="mb-6 flex justify-center">
            <Cross className="h-8 w-8 rotate-45 text-white/80" />
          </div>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <AnimatedStat
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

