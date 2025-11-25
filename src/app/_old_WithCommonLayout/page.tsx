import ContactForm from "./components/contact-form";
import Footer from "./components/footer";

import { Header } from "./components/header";


import { TopBanner } from "./components/top-banner";

export default function Home() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Header />
      
      {/* <TeamSection/> */}
      <ContactForm/>
      <Footer/>
    </main>
  )
}

