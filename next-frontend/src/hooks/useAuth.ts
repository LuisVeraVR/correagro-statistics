import { useSession } from "next-auth/react";

export const useAuth = () => {
  const { data: session, status } = useSession();

  return {
    token: session?.user?.accessToken,
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
};
