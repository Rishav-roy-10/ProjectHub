import React, { createContext, useState, useEffect } from "react";
import axios from '../config/axios';

// Create Context
export const UserContext = createContext(null);

// Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // store user data
  const [loading, setLoading] = useState(true);

  // Load user from localStorage and validate token on refresh
  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (storedUser && token) {
        try {
          // Validate token with backend
          const response = await axios.get('/user/validate-token');
          if (response.data.valid) {
            setUser(JSON.parse(storedUser));
          } else {
            // Token is invalid, clear everything
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          console.log('Token validation failed:', error);
          // Token validation failed, clear everything
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  // Function to log in user
  const login = (userData) => {
    // Set user in state
    setUser(userData);
    // Persist user data in localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    // Confirm successful login
    console.log("User logged in successfully:", userData.name || userData.email || "User");
  };

  // Function to log out user
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider value={{ user, login, logout, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
