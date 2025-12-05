"use client"
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ChevronRight,  
  HelpCircle,
  X,
  Layout,
  FileText,
  Image,
  LayoutTemplate,
  Users,
  User,
  LogOut,
  Move,
  Save,
  Eye,
  QrCode
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
      question: 'How does the drag-and-drop dashboard layout work?',
      answer: 'Our dashboard uses React Grid Layout for creating customizable layouts. Admins can drag and drop widgets to reposition them, resize widgets, save layouts as templates, and switch between different aspect ratios (16:9, 4:3, 21:9).'
    },
    {
      question: 'What types of content can I create?',
      answer: 'You can create three types of notices: Text notices with rich formatting using TipTap editor, Image notices with multiple format support, and PDF notices for documents. All content can be organized into custom categories with icons.'
    },
    {
      question: 'How does the template system work?',
      answer: 'Admins can save dashboard layouts as reusable templates. When creating a new notice interface, you can choose from existing templates to speed up your workflow and maintain consistency across different notice boards.'
    },
    {
      question: 'What is the role-based access control system?',
      answer: 'Digital Notice Board has four roles: Super Admin (full system control), Admin (content management and user creation), Moderator (notice CRUD operations), and User (read-only access). The first signup automatically becomes Super Admin.'
    },
    {
      question: 'How do I customize the public notice board?',
      answer: 'Go to Dashboard → Manage Public Notice to configure branding (logo, title, subtitle), set background (solid color, gradient, or custom image), add emergency contact information, and customize styling options. Changes appear instantly on the public notice board.'
    }
  ];

  const additionalFeatures = [
    {
      icon: Layout,
      title: 'Drag-and-Drop Dashboard',
      description: 'Create customizable layouts with React Grid Layout. Drag widgets, resize them, and save layouts as templates for reuse.'
    },
    {
      icon: FileText,
      title: 'Rich Text Editor',
      description: 'Create professional notices with TipTap rich text editor. Support for formatting, categories, and content organization.'
    },
    {
      icon: LayoutTemplate,
      title: 'Template System',
      description: 'Save and reuse dashboard layouts as templates. Speed up workflow and maintain consistency across notice boards.'
    },
    {
      icon: Image,
      title: 'Multi-Format Support',
      description: 'Upload images and PDF documents. Support for multiple image formats with customizable fit options and PDF display.'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Four-tier role system: Super Admin, Admin, Moderator, and User. Each role has specific permissions and access levels.'
    },
    {
      icon: QrCode,
      title: 'Public Display',
      description: 'QR code integration for easy access. Customizable branding, auto-refresh, and real-time content updates on public notice board.'
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30 text-gray-900 overflow-x-hidden font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-blue-100 px-6 py-4 shadow-lg shadow-blue-100/50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="relative">
              <img 
                src="/images/logo.png" 
                alt="Digital Notice Board Logo" 
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
            </div>
            <span className="text-2xl font-extrabold text-black tracking-tight">Digital Notice Board</span>
          </Link>
          
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 hover:scale-105 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            {session && (
              <>
                <Link href="/dashboard"  className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 hover:scale-105 relative group">
                  Dashboard
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
                <Link href="/notice" target='_blank' className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 hover:scale-105 relative group">
                  Notice
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
              </>
            )}
            <Link href="#features" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 hover:scale-105 relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="#faq" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 hover:scale-105 relative group">
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            
            <div className="flex space-x-4">
              {session ? (
                // Logged in state
                <div className="relative user-menu">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 px-4 py-2 rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative">
                      <User className="w-5 h-5 text-blue-600" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-gray-800 font-semibold">
                      {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-blue-200 rounded-lg shadow-xl shadow-blue-200/50 py-2 z-50 backdrop-blur-sm">
                      <div className="px-4 py-3 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Account</p>
                        <p className="text-sm text-gray-700 font-medium">{session.user?.email}</p>
                      </div>
                     
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                      >
                        <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Logged out state
                <>
                  <Link href="/login" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200">
                    <button className="bg-transparent border-2 border-blue-500 text-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 font-semibold">
                      Login
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-blue-600" /> : <Bell className="w-6 h-6 text-blue-600" />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 bg-white border-b-2 border-blue-200 py-4 shadow-xl">
            <div className="container mx-auto px-6 space-y-4">
              <Link href="/" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 block py-2 border-b border-blue-100">Home</Link>
              {session && (
                <>
                  <Link href="/dashboard" target='_blank' className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 block py-2 border-b border-blue-100">Dashboard</Link>
                  <Link href="/notice" target='_blank' className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 block py-2 border-b border-blue-100">Notice</Link>
                </>
              )}
              <Link href="#features" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 block py-2 border-b border-blue-100">Features</Link>
              <Link href="#faq" className="text-gray-700 font-semibold hover:text-blue-600 transition-all duration-200 block py-2 border-b border-blue-100">FAQ</Link>
              
              <div className="flex flex-col space-y-4 pt-4">
                {session ? (
                  <>
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-800">Welcome, {session.user?.name || session.user?.email?.split('@')[0] || 'User'}!</p>
                    </div>
                    <Link href="/dashboard" target="_blank">
                      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-blue-200">
                        Go to Dashboard
                      </button>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-transparent border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 font-semibold"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="w-full bg-transparent border-2 border-blue-500 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200 font-semibold">
                        Login
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center relative mt-20">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        
        <div className="relative z-10">
          {status === 'loading' ? null : session ? (
            <TypewriterEffectSmooth
              words={[
                { text: 'Welcome back,', className: 'text-gray-900 font-extrabold tracking-tight' },
                { text: ` ${displayName}!`, className: 'text-blue-600 font-extrabold tracking-tight' },
              ]}
              className="mb-6"
            />
          ) : (
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 leading-tight tracking-tight">
              <> 
                Transform Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Digital Notice Board</span>
              </>
            </h1>
          )}
          <p className="text-xl md:text-2xl text-gray-700 mb-10 font-medium leading-relaxed">
            {session ? (
              <span style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                Ready to manage your notices? Access your dashboard to create, organize, and share important information with your team.
              </span>
            ) : (
              <span style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                A modern digital notice board system with drag-and-drop layouts, rich text editing, template system, and role-based access control for efficient team communication.
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-4">
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg transition-all duration-200 font-bold text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300"
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
                  className="bg-transparent border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 font-bold text-lg"
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg transition-all duration-200 font-bold text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300"
                >
                  Get Started
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="bg-transparent border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-200 font-bold text-lg"
                >
                  Learn More
                </motion.button>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:block relative z-10">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/50 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 pointer-events-none z-10"></div>
            <video
              className="w-full h-auto relative z-0"
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
            
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl z-20"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-purple-400 rounded-br-2xl z-20"></div>
          </motion.div>
        </div>
      </main>



      <section id="features" className="container mx-auto px-6 py-20 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="text-center mb-16 relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
            <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold text-sm uppercase tracking-wider">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">
            More Than Just a <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Notice Board</span>
          </h2>
          <p className="text-gray-700 text-xl md:text-2xl font-semibold max-w-2xl mx-auto">Comprehensive features for creating and managing digital notice boards</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white border-2 border-blue-100 p-8 rounded-2xl text-center hover:scale-105 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-200/50 group relative overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50 group-hover:to-purple-50/50 transition-all duration-300 -z-10"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <feature.icon className="text-white w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold mb-4 text-gray-900 tracking-tight">{feature.title}</h3>
                <p className="text-gray-700 font-medium leading-relaxed">{feature.description}</p>
              </div>
              
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-blue-200 rounded-tr-2xl opacity-50"></div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="container mx-auto px-6 py-20 bg-gray-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">
            How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin</span> Creates a Notice
          </h2>
          <p className="text-gray-600 text-xl font-semibold max-w-2xl mx-auto">Create professional notices in minutes with our intuitive drag-and-drop interface</p>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Vertical Timeline Line */}
          <div className="absolute left-8 md:left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-500 to-purple-500 rounded-full"></div>
          
          {/* Timeline Steps */}
          <div className="space-y-12">
            {[
              {
                number: 1,
                icon: Layout,
                title: "Create Interface Page",
                description: "Start by creating a new notice interface page. Choose a layout and set up your workspace."
              },
              {
                number: 2,
                icon: Move,
                title: "Drag & Drop Content",
                description: "Easily drag and drop notices into different categories - Images, Text, or PDF files. Organize content effortlessly."
              },
              {
                number: 3,
                icon: LayoutTemplate,
                title: "Apply Template",
                description: "Choose from existing professional templates to speed up your workflow and maintain consistency."
              },
              {
                number: 4,
                icon: Save,
                title: "Save & Publish",
                description: "Click save to store your notice. It will automatically appear on the public notice board for everyone to see."
              },
              {
                number: 5,
                icon: Eye,
                title: "Live on Notice Board",
                description: "Your notice is now live! Everyone can view it instantly on the public notice board."
              }
            ].map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative flex items-start gap-6"
              >
                {/* Timeline Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    <span className="text-white font-extrabold text-xl md:text-2xl">{step.number}</span>
                  </div>
                  {/* Dotted connector line - only show if not last item */}
                  {index < 4 && (
                    <div className="absolute left-1/2 top-full w-0.5 h-12 border-l-2 border-dashed border-blue-300 transform translate-x-[-50%] hidden md:block"></div>
                  )}
                </div>
                
                {/* Content Card */}
                <div className="flex-1 bg-white rounded-xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300 group">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 font-medium leading-relaxed text-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="container mx-auto px-6 py-20 bg-gradient-to-b from-white to-blue-50/20 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="text-center mb-16 relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
            <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold text-sm uppercase tracking-wider">FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">
            Frequently <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Asked Questions</span>
          </h2>
          <p className="text-gray-700 text-xl md:text-2xl font-semibold">Get quick answers to common queries</p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          {/* FAQ Image on Left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="hidden md:block"
          >
            <div className="relative w-full">
              <img 
                src="/images/faq-illustration.png" 
                alt="FAQ Illustration - People interacting with technology and FAQ information" 
                className="w-full h-auto object-contain"
                style={{ mixBlendMode: 'normal' }}
              />
            </div>
          </motion.div>

          {/* FAQ Content on Right */}
          <div className="space-y-5">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border-2 border-blue-100 p-6 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 group"
            >
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setActiveModal(activeModal === faq.question ? null : faq.question)}
              >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <HelpCircle className="text-white w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{faq.question}</h3>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {activeModal === faq.question ? (
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <X className="text-blue-600 w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <ChevronRight className="text-blue-600 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                </div>
              </div>
              <AnimatePresence>
                {activeModal === faq.question && (
                    <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                  >
                      <div className="mt-5 pt-5 border-t-2 border-blue-100">
                        <p className="text-gray-700 font-medium leading-relaxed text-lg">
                    {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 border-t-4 border-blue-500 py-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-10 relative z-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="relative">
                <img 
                  src="/images/logo.png" 
                  alt="Digital Notice Board Logo" 
                  className="w-12 h-12 object-contain drop-shadow-lg"
                />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Digital Notice Board</span>
            </Link>
            <p className="text-gray-300 font-medium leading-relaxed">Revolutionizing team communication and collaboration with cutting-edge technology.</p>
          </div>
          
          <div>
            <h4 className="text-xl font-extrabold mb-6 text-white tracking-tight uppercase text-sm">Features</h4>
            <ul className="space-y-3">
              {['Dashboard Layout', 'Rich Text Editor', 'Template System', 'Category Management'].map((item) => (
                <li key={item}>
                  <Link href="#features" className="text-gray-300 font-semibold hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-extrabold mb-6 text-white tracking-tight uppercase text-sm">Resources</h4>
            <ul className="space-y-3">
              {['Public Notice Board', 'Role Management', 'Widget System', 'QR Code Access'].map((item) => (
                <li key={item}>
                  <Link href="/notice" className="text-gray-300 font-semibold hover:text-blue-400 transition-all duration-200 hover:translate-x-1 inline-block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-extrabold mb-6 text-white tracking-tight uppercase text-sm">Contact</h4>
            <ul className="space-y-3">
              <li className="text-gray-300 font-medium flex items-start">
                <span className="text-blue-400 mr-2">✉</span>
                <Link href="mailto:naeem.cse7.bu@gmail.com" className="hover:text-blue-400 transition-colors duration-200 cursor-pointer">naeem.cse7.bu@gmail.com</Link>
              </li>
              <li className="text-gray-300 font-medium flex items-start">
                <span className="text-blue-400 mr-2">✉</span>
                <Link href="mailto:ashik.cse7.bu@gmail.com" className="hover:text-blue-400 transition-colors duration-200 cursor-pointer">ashik.cse7.bu@gmail.com</Link>
              </li>
              <li className="text-gray-300 font-medium flex items-start">
                <span className="text-blue-400 mr-2">📞</span>
                <span>+8801623094662</span>
              </li>
              <li className="text-gray-300 font-medium flex items-start">
                <span className="text-blue-400 mr-2">📞</span>
                <span>+8801722432449</span>
              </li>
            </ul> 


          </div>
        </div>
        <div className="container mx-auto px-6 mt-12 text-center border-t-2 border-gray-800 pt-8 relative z-10">
          <p className="text-gray-400 font-semibold">
            © 2024 Digital Notice Board. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
