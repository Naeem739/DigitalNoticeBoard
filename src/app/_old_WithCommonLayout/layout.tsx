import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import '../globals.css';
// import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
// import Providers from '@/lib/Providers/Providers';


import { Toaster } from 'sonner';

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: 'Digital Notice Board',
   description: 'Digital Notice Board',
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (

         
           
                  <div>
                     <Toaster 
                       position='top-center' 
                       duration={2000}
                       richColors
                       closeButton
                     />
                     {children}
                  </div>
             
      
 
   );
}
