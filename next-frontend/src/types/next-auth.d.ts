import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    traderName?: string | null
    accessToken?: string
  }
  interface Session {
    user: User & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    traderName?: string | null
    accessToken?: string
  }
}
