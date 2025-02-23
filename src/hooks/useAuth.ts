import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Implement your authentication check here
    // This could be checking a JWT token, session, etc.
    const checkAuth = async () => {
      try {
        // Add your authentication logic here
        // For example: check if token exists in localStorage
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading }; 
};