"use client"
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ChevronRight,  
  HelpCircle,
  X,
  Zap,
  Lock,
  Clock,
  User,
  LogOut
} from 'lucide-react';

import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';

// const fadeInUp = {
//   hidden: { opacity: 0, y: 60 },
//   visible: { opacity: 1, y: 0 }
// };

// const staggerChildren = {
//   hidden: { opacity: 0 },
//   visible: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.3
//     }
//   }
// };

export default function Home() {
  const { data: session, status } = useSession();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  // const [activeTab, setActiveTab] = useState('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';
  
  // const pricingPlans = [
  //   {
  //     name: 'Starter',
  //     price: { monthly: 19, yearly: 190 },
  //     features: [
  //       'Up to 5 team members',
  //       'Basic notice board',
  //       'Email support'
  //     ],
  //     recommended: false
  //   },
  //   {
  //     name: 'Professional',
  //     price: { monthly: 49, yearly: 490 },
  //     features: [
  //       'Up to 20 team members',
  //       'Advanced notice board',
  //       'Priority support',
  //       'Custom branding'
  //     ],
  //     recommended: true
  //   },
  //   {
  //     name: 'Enterprise',
  //     price: { monthly: 99, yearly: 990 },
  //     features: [
  //       'Unlimited team members',
  //       'Full feature set',
  //       '24/7 dedicated support',
  //       'Advanced analytics'
  //     ],
  //     recommended: false
  //   }
  // ];

  const faqs = [
    {
      question: 'How does Smart Notice Board work?',
      answer: 'Our platform provides a centralized digital notice board that allows real-time collaboration, instant updates, and seamless team communication.'
    },
    {
      question: 'Is my data secure?',
      answer: 'We use state-of-the-art encryption and follow strict data protection protocols to ensure your team\'s information remains confidential.'
    },
    {
      question: 'Can I change my plan later?',
      answer: 'Absolutely! You can upgrade, downgrade, or cancel your subscription at any time with no hidden fees.'
    }
  ];

  const additionalFeatures = [
    {
      icon: Zap,
      color: 'text-blue-500',
      title: 'Instant Notifications',
      description: 'Stay updated with real-time alerts and push notifications across all devices.'
    },
    {
      icon: Lock,
      color: 'text-green-500',
      title: 'Advanced Security',
      description: 'Enterprise-grade encryption and multi-factor authentication to protect your data.'
    },
    {
      icon: Clock,
      color: 'text-purple-500',
      title: 'Smart Scheduling',
      description: 'Automated task tracking and deadline management for enhanced productivity.'
    }
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    setUserMenuOpen(false);
  };

  const handleGetStarted = () => {
    if (typeof window === 'undefined') return
    
    if (session) {
      window.open('/dashboard', '_blank');
    } else {
      window.location.href = '/signup';
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (userMenuOpen && !target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-[#1e1e1e] px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Bell className="text-yellow-500 w-8 h-8" />
            <span className="text-2xl font-bold">Smart Notice Board</span>
          </div>
          
          <div className="hidden md:flex space-x-6 items-center">
            {session && (
              <>
                <a href="/dashboard" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Dashboard</a>
                <a href="/notice" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Notice</a>
              </>
            )}
            <a href="#pricing" className="text-gray-300 hover:text-yellow-500 transition">Pricing</a>
            <a href="#features" className="text-gray-300 hover:text-yellow-500 transition">Features</a>
            <a href="#faq" className="text-gray-300 hover:text-yellow-500 transition">FAQ</a>
            
            <div className="flex space-x-4">
              {session ? (
                // Logged in state
                <div className="relative user-menu">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 bg-[#2a2a2a] px-4 py-2 rounded-md hover:bg-[#3a3a3a] transition"
                  >
                    <User className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-300">
                      {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm text-gray-300">{session.user?.email}</p>
                      </div>
                     
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-[#3a3a3a] transition"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Logged out state
                <>
                  <a href="/login" className="text-gray-300 hover:text-yellow-500 transition">
                    <button className="bg-transparent border border-yellow-500 text-yellow-500 px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition">
                      Login
                    </button>
                  </a>
                  <a href="/signup">
                    <button className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition">
                      Get Started
                    </button>
                  </a>
                </>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 bg-[#1e1e1e] py-4">
            <div className="container mx-auto px-6 space-y-4">
              {session && (
                <>
                  <a href="/dashboard" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Dashboard</a>
                  <a href="/notice" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Notice</a>
                </>
              )}
              <a href="#pricing" className="text-gray-300 hover:text-yellow-500 transition">Pricing</a>
              <a href="#features" className="text-gray-300 hover:text-yellow-500 transition">Features</a>
              <a href="#faq" className="text-gray-300 hover:text-yellow-500 transition">FAQ</a>
              
              <div className="flex flex-col space-y-4">
                {session ? (
                  <>
                    <div className="px-4 py-2 bg-[#2a2a2a] rounded-md">
                      <p className="text-sm text-gray-300">Welcome, {session.user?.name || session.user?.email?.split('@')[0] || 'User'}!</p>
                    </div>
                    <a href="/dashboard" target="_blank">
                      <button className="w-full bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition">
                        Go to Dashboard
                      </button>
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-transparent border border-red-500 text-red-500 px-4 py-2 rounded-md hover:bg-red-500 hover:text-white transition"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <a href="/login">
                      <button className="w-full bg-transparent border border-yellow-500 text-yellow-500 px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition">
                        Login
                      </button>
                    </a>
                    <a href="/signup">
                      <button className="w-full bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition">
                        Get Started
                      </button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          {status === 'loading' ? null : session ? (
            <TypewriterEffectSmooth
              words={[
                { text: 'Welcome back,', className: 'text-white' },
                { text: ` ${displayName}!`, className: 'text-yellow-500' },
              ]}
              className="mb-6"
            />
          ) : (
            <h1 className="text-5xl font-bold mb-6">
              <> 
                Revolutionize Your <span className="text-yellow-500">Team Communication</span>
              </>
            </h1>
          )}
          <p className="text-xl text-gray-400 mb-8">
            {session ? (
              'Ready to manage your notices? Access your dashboard to create, organize, and share important information with your team.'
            ) : (
              'Smart Notice Board is the ultimate platform for seamless, real-time team collaboration and information sharing.'
            )}
          </p>
          <div className="flex space-x-4">
            {session ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open('/dashboard', '_blank')
                    }
                  }}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-md hover:bg-yellow-600 transition"
                >
                  Go to Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open('/notice', '_blank')
                    }
                  }}
                  className="bg-transparent border border-yellow-500 text-yellow-500 px-6 py-3 rounded-md hover:bg-yellow-500 hover:text-black transition"
                >
                  View Notice Board
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-md hover:bg-yellow-600 transition"
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-transparent border border-yellow-500 text-yellow-500 px-6 py-3 rounded-md hover:bg-yellow-500 hover:text-black transition"
                >
                  Learn More
                </motion.button>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl"
          >
            <video
              className="w-full h-auto"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            >
              <source src="/videos/demo-video.mp4" type="video/mp4" />
              <source src="/videos/demo-video.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
            
            {/* Optional overlay for better visual integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </motion.div>
        </div>
      </main>



      <section className="container mx-auto px-6 py-16 bg-[#1e1e1e]">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            More Than Just a <span className="text-yellow-500">Notice Board</span>
          </h2>
          <p className="text-gray-400 text-xl">Powerful features to supercharge your teams productivity</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-[#2a2a2a] p-6 rounded-xl text-center hover:scale-105 transition-transform"
            >
              <feature.icon className={`${feature.color} w-12 h-12 mx-auto mb-4`} />
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="faq" className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Frequently <span className="text-yellow-500">Asked Questions</span>
          </h2>
          <p className="text-gray-400 text-xl">Get quick answers to common queries</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1e1e1e] p-6 rounded-lg"
            >
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setActiveModal(activeModal === faq.question ? null : faq.question)}
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="text-yellow-500 w-6 h-6" />
                  <h3 className="text-xl font-semibold">{faq.question}</h3>
                </div>
                {activeModal === faq.question ? <X className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
              </div>
              <AnimatePresence>
                {activeModal === faq.question && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-gray-400 mt-4 overflow-hidden"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="bg-[#1e1e1e] py-12">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="text-yellow-500 w-8 h-8" />
              <span className="text-2xl font-bold">Smart Notice Board</span>
            </div>
            <p className="text-gray-400">Revolutionizing team communication and collaboration</p>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Integrations', 'Updates'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-yellow-500 transition">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {['About', 'Careers', 'Blog', 'Press'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-yellow-500 transition">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">Email: naeem.cse7.bu@gmail.com</li>
              <li className="text-gray-400">Email: ashik.cse7.bu@gmail.com</li>
              <li className="text-gray-400">Phone: +8801623094662</li>
            </ul>
            <div className="flex space-x-4 mt-4">
              {['Twitter', 'LinkedIn', 'Facebook'].map((platform) => (
                <a 
                  key={platform} 
                  href="#" 
                  className="text-gray-400 hover:text-yellow-500 transition"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-8 text-center border-t border-gray-800 pt-6">
          <p className="text-gray-400">
            © 2024 Smart Notice Board. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
