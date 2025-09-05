import React, { useState, useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Login = () => {
  const { login } = useContext(UserContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function submitHandler(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    axios.post('/user/login', {
      email,
      password
    }).then((res) => {
      console.log(res.data);
      // Store token in localStorage
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      // Use the login function from context to properly save user data
      login(res.data.user);
      navigate('/');
    }).catch((err) => {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }).finally(() => {
      setLoading(false);
    });
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      
      <form className="space-y-5" onSubmit={submitHandler}>
        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter your email"
            required
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-2">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            required
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition rounded-lg py-3 font-medium"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center text-sm mt-6">
        Don't have an account?{" "}
        <Link to="/register" className="text-indigo-400 hover:underline">
          Create one
        </Link>
      </p>
    </div>
    </main>
  );
}

export default Login;
