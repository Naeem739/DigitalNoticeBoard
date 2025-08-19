
import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
// import prisma from "@/lib/prisma"
import { compare } from "bcrypt"
import { prisma } from "@/db/prisma"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        // console.log(credentials);
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })
        if (!user) {
          return null
        }
        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }
        return {
          id: user.id + '',
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.id = token.sub;
        session.user.role = token.role;
        // attach allowed routes for moderator to the client session to avoid hydration issues
        // keep it undefined for other roles
        if (Array.isArray((token as any).allowedRoutes)) {
          (session.user as any).allowedRoutes = (token as any).allowedRoutes as string[];
        }
      }

      // console.log("From session_________________________");
      // console.log("session", session);
      // console.log(token);
      return session;
    },
    async jwt({token, user}){
      if(user){
        token.name = user.name as string;
        token.email = user.email as string;
        // next-auth sets sub as string id; keep token.id for convenience
        (token as any).id = (user as any).id as string;
        (token as any).role = (user as any).role as string;
      }

      // Enrich moderator token with allowed routes from DB to enable middleware checks
      try {
        const role = (token as any).role as string | undefined;
        if (role === 'MODERATOR') {
          const moderatorId = ((token as any).id as string) || (token.sub as string);
          if (moderatorId) {
            const permission = await prisma.moderatorPermission.findUnique({
              where: { moderatorId },
              select: { allowedRoutes: true }
            });
            (token as any).allowedRoutes = permission?.allowedRoutes ?? [];
          }
        } else {
          // Remove to keep token small for other roles
          delete (token as any).allowedRoutes;
        }
      } catch (e) {
        // On any error, default to no extra routes
        if ((token as any).role === 'MODERATOR') {
          (token as any).allowedRoutes = [];
        }
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }

