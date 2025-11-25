import { Cross, Target, Smartphone, Clock, Menu, Home, Ambulance } from 'lucide-react'

interface ServiceProps {
  icon: React.ReactNode
  title: string
  description: string
}

function ServiceCard({ icon, title, description }: ServiceProps) {
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="mb-6 rounded-full bg-custom-gradient p-4 text-white transition-transform duration-300 ease-in-out group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-4 text-xl text-[#26547c] font-semibold text-primary">
        {title}
      </h3>
      <p className="text-muted-foreground  text-[#999999]">
        {description}
      </p>
    </div>
  )
}

export default function Services() {
  const services: ServiceProps[] = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Advancing Sustainable Farming and Income Generation :",
      description: "To support the nutritional needs of rural families living in poverty and to improve their financial situation, we distribute high-yield vegetable seeds along with practical advice. "
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Bridging Educational Gaps for Marginalized Communities through non formal education initiative :  ",
      description: "This program focuses on delivering educational materials, including books, notebooks, and pens, to non-formal education centers, thereby supporting the education of underprivileged children in rural."

    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Health and Family planning ",
      description: "Under the health and family planning program, the organization is implementing a range of activities designed to enhance awareness among suburban and rural populations."
    },
    {
      icon: <Menu className="h-6 w-6" />,
      title: "Employment Generation and Advancement",
      description: "Bondhon is dedicated to empowering both youth and women by providing training and resources in a variety of sectors. These sectors include livestock farming (such as poultry, goats, and cattle), nursery creation, small-scal. "
    },
    {
      icon: <Home className="h-6 w-6" />,
      title: "Building Home",
      description: "Laculis ullamcorper at est. Curabitur sagittis dignissim espam nibh quis dictum. vehicula sit amet vestibulum congue. Morbi non."
    },
    {
      icon: <Ambulance className="h-6 w-6" />,
      title: "Medical Hospital",
      description: "Laculis ullamcorper at est. Curabitur sagittis dignissim espam nibh quis dictum. vehicula sit amet vestibulum congue. Morbi non."
    }
  ]

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container w-full md:w-[75%] mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-primary md:text-5xl">
            OUR SERVICES
          </h2>
          <div className="mb-6 flex justify-center">
            <Cross className="h-8 w-8 rotate-45 text-sky-400" />
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground  text-[#999999]">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo 
            ligula eget dolor. Aenean massa. Cum sociis natoque.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

