import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../screens/Login';
import Register from '../screens/register';
import Home from '../screens/home';
import AddUser from '../screens/AddUser';
import Navbar from '../components/Navbar';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/add-user" element={<AddUser />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default AppRoutes;
