"use client"
import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ChevronRight,  
  Users, 
  Share2, 
  LayoutDashboard,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  X,
  Zap,
  Lock,
  Clock
} from 'lucide-react';

export default function Home() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const pricingPlans = [
    {
      name: 'Starter',
      price: { monthly: 19, yearly: 190 },
      features: [
        'Up to 5 team members',
        'Basic notice board',
        'Email support'
      ],
      recommended: false
    },
    {
      name: 'Professional',
      price: { monthly: 49, yearly: 490 },
      features: [
        'Up to 20 team members',
        'Advanced notice board',
        'Priority support',
        'Custom branding'
      ],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: { monthly: 99, yearly: 990 },
      features: [
        'Unlimited team members',
        'Full feature set',
        '24/7 dedicated support',
        'Advanced analytics'
      ],
      recommended: false
    }
  ];

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

  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-[#1e1e1e] px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Bell className="text-yellow-500 w-8 h-8" />
            <span className="text-2xl font-bold">Smart Notice Board</span>
          </div>
          
          <div className="hidden md:flex space-x-6 items-center">
            <a href="/dashboard" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Dashboard</a>
            <a href="/notice" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Notice</a>
            <a href="#pricing" className="text-gray-300 hover:text-yellow-500 transition">Pricing</a>
            <a href="#features" className="text-gray-300 hover:text-yellow-500 transition">Features</a>
            <a href="#faq" className="text-gray-300 hover:text-yellow-500 transition">FAQ</a>
            
            <div className="flex space-x-4">

            <a href="/login" className="text-gray-300 hover:text-yellow-500 transition"><button className="bg-transparent border border-yellow-500 text-yellow-500 px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition">
                Login
              </button></a>
              
              <button className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition">
                Get Started
              </button>
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
            <a href="/dashboard" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Dashboard</a>
            <a href="/notice" target='_blank' className="text-gray-300 hover:text-yellow-500 transition">Notice</a>
            <a href="#pricing" className="text-gray-300 hover:text-yellow-500 transition">Pricing</a>
            <a href="#features" className="text-gray-300 hover:text-yellow-500 transition">Features</a>
            <a href="#faq" className="text-gray-300 hover:text-yellow-500 transition">FAQ</a>
              
              <div className="flex flex-col space-y-4">
                <button className="bg-transparent border border-yellow-500 text-yellow-500 px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition">
                  Login
                </button>
                <button className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-bold mb-6">
            Revolutionize Your <span className="text-yellow-500">Team Communication</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Smart Notice Board is the ultimate platform for seamless, real-time team collaboration and information sharing.
          </p>
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
          </div>
        </div>
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1e1e1e] p-6 rounded-xl shadow-2xl"
          >
            <div className="flex space-x-4 mb-4">
              <Users className="text-yellow-500 w-8 h-8" />
              <Share2 className="text-blue-500 w-8 h-8" />
              <LayoutDashboard className="text-green-500 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Collaborative Workspace</h3>
            <p className="text-gray-400">
              Bring your team together with real-time updates, shared boards, and seamless communication.
            </p>
          </motion.div>
        </div>
      </main>

      <section className="container mx-auto px-6 py-16 bg-[#1e1e1e]">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            More Than Just a <span className="text-yellow-500">Notice Board</span>
          </h2>
          <p className="text-gray-400 text-xl">Powerful features to supercharge your team's productivity</p>
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