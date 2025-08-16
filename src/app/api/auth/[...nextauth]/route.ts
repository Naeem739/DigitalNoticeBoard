
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
      }

      // console.log("From session_________________________");
      // console.log("session", session);
      // console.log(token);
      return session;
    },
    async jwt({token, user}){
      if(user){
         token.name = user.name;
        token.email = user.email;
         token.id = user.id;
         token.role = user.role;
      }
      // console.log("token", token);
      // console.log("user from NextAuth ",user);

      // console.log("_____________________________________________________________");
      return token;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }

