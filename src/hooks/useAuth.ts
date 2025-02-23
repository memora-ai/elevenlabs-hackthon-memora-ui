import { useUser } from '@auth0/nextjs-auth0/client';

export const useAuth = () => {
  const { user, isLoading } = useUser();
  
  return {
    isAuthenticated: !!user,
    isLoading
  };
};