import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const DEMO_USERS = [
    { id: "1", name: "admin", email: "admin@correagro.com", password: "admin123", role: "admin", traderName: null },
    { id: "2", name: "demo", email: "demo@correagro.com", password: "demo123", role: "viewer", traderName: "Demo Trader" },
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      authorize: async (credentials) => {
        console.log("[v0] authorize called with:", credentials?.username)
        if (!credentials?.username || !credentials?.password) {
            return null
        }

        // 1. Try demo users first (always available, no backend needed)
        const demoUser = DEMO_USERS.find(
            u => (u.name === credentials.username || u.email === credentials.username) && u.password === credentials.password
        )
        if (demoUser) {
            console.log("[v0] authorize: demo user matched:", demoUser.name)
            return {
                id: demoUser.id,
                name: demoUser.name,
                email: demoUser.email,
                accessToken: "demo-token",
                role: demoUser.role,
                traderName: demoUser.traderName,
            }
        }
        
        // 2. Try backend API
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 5000)

            const res = await fetch(`${apiUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password,
                }),
                signal: controller.signal,
            })
            clearTimeout(timeout)

            if (!res.ok) {
                console.log("[v0] authorize: backend returned", res.status)
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
            console.log("[v0] authorize: backend unreachable:", (e as Error)?.message)
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
  trustHost: true,
  secret: process.env.AUTH_SECRET || "correagro-secret-key-2024",
})
