import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
            return null
        }
        
        try {
            // Call NestJS Backend
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password,
                }),
            })

            if (!res.ok) {
                console.error("Login failed:", res.status, res.statusText)
                return null
            }

            const data = await res.json()
            
            if (data.access_token && data.user) {
                return {
                    id: data.user.id.toString(), 
                    name: data.user.name,
                    email: data.user.email,
                    accessToken: data.access_token,
                    role: data.user.role,
                    traderName: data.user.traderName,
                }
            }
            return null
        } catch (e) {
            console.error("Auth error:", e)
            return null
        }
      },
    }),
  ],
  callbacks: {
      async jwt({ token, user }) {
          if (user) {
              token.accessToken = (user as any).accessToken
              token.role = (user as any).role
              token.traderName = (user as any).traderName
          }
          return token
      },
      async session({ session, token }) {
          if (token) {
             (session.user as any).accessToken = token.accessToken as string;
             (session.user as any).role = token.role as string;
             (session.user as any).traderName = token.traderName as string;
          }
          return session
      }
  },
  pages: {
      signIn: '/login',
  },
  session: {
      strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "secret",
})
