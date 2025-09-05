import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from '../config/axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  function submitHandler(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    axios.post('/user/register', {
      name: name.trim(),
      email,
      password
    }).then((res) => {
      console.log(res.data);
      // Store token if needed
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      navigate('/login');
    }).catch((err) => {
      console.log(err.response?.data);
      
      // Handle specific MongoDB duplicate key error
      if (err.response?.data?.error?.includes('duplicate key') || 
          err.response?.data?.error?.includes('already exists')) {
        setError('An account with this email already exists. Please use a different email or try logging in.');
      } else {
        setError(err.response?.data?.error || 'Registration failed');
      }
    }).finally(() => {
      setLoading(false);
    });
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-center mb-6">Register</h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={submitHandler}>
        <div>
          <label className="block text-sm mb-2">Name</label>
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Enter your name"
            required
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter your email"
            required
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            required
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Confirm Password</label>
          <input
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Confirm your password"
            required
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 
                     transition rounded-lg py-3 font-medium"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-400 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
    </main>
  );
}

export default Register;
