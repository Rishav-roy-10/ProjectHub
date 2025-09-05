import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const Navbar = () => {
  const { user, logout, loading } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get('/user/logout');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <nav className="bg-emerald-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-3xl font-bold px-10 flex items-center">
            <Link to="/" className="text-gray-800">&lt;</Link>
            <Link to="/" className="text-2xl font-bold">Project</Link>
            <Link to="/" className="text-gray-800 font-bold">Hub</Link>
            <Link to="/" className="text-gray-800">&gt;</Link>
          </div>
          <div className="flex space-x-4 items-center">
            <span className="text-gray-300">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-emerald-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-3xl font-bold px-10 flex items-center">
          <Link to="/" className="text-gray-800">&lt;</Link>
          <Link to="/" className="text-2xl font-bold">Project</Link>
          <Link to="/" className="text-gray-800 font-bold">Hub</Link>
          <Link to="/" className="text-gray-800">&gt;</Link>
        </div>
        <div className="flex space-x-4 items-center">
          <button
            onClick={() => navigate('/add-user')}
            title="Add user to a project"
            className="text-white hover:text-indigo-300 transition text-xl"
          >
            <i className="ri-user-add-line" />
          </button>
          {user ? (
            <>
              <span className="text-gray-300">Hello, {user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-white hover:text-indigo-300 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-indigo-300 transition font-bold">Login</Link>
              <Link to="/register" className="text-white hover:text-indigo-300 transition font-bold">Register</Link>
            </>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;