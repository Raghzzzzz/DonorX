import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import NewRequest from './pages/NewRequest';
import Tracking from './pages/Tracking';
import Audit from './pages/Audit';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { DonorProvider, useDonor } from './context/DonorContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useDonor();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

function App() {
    return (
        <DonorProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route path="dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="hospital-dashboard" element={
                            <ProtectedRoute>
                                <HospitalDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="request" element={
                            <ProtectedRoute>
                                <NewRequest />
                            </ProtectedRoute>
                        } />
                        <Route path="tracking" element={
                            <ProtectedRoute>
                                <Tracking />
                            </ProtectedRoute>
                        } />
                        <Route path="audit" element={
                            <ProtectedRoute>
                                <Audit />
                            </ProtectedRoute>
                        } />
                        <Route path="profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />
                    </Route>
                </Routes>
            </Router>
        </DonorProvider>
    );
}

export default App;
