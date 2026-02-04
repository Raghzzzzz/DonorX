import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDonor } from '../context/DonorContext';

const Header = () => {
    const { user, logout } = useDonor();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="container flex justify-between items-center" style={{ height: '100%' }}>
                <Link to="/" className="logo">
                    <span style={{ color: 'var(--primary-color)' }}>Donor</span>
                    <span style={{ color: 'var(--text-primary)' }}>X</span>
                </Link>
                <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
                        Home
                    </NavLink>

                    {user && (
                        <>
                            <NavLink to="/hospital-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                                Hospital Dashboard
                            </NavLink>
                            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                                Request Dashboard
                            </NavLink>
                            <Link to="/request" className="btn btn-primary" style={{ padding: '0.5rem 1rem', color: 'white' }}>
                                New Request
                            </Link>
                        </>
                    )}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user ? (
                        <>
                            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-secondary)' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ fontWeight: '500' }}>{user.username}</span>
                            </Link>
                            <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)' }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login" className="btn" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)' }}>
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', color: 'white' }}>
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
