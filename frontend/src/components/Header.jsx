import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDonor } from '../context/DonorContext';

const navLinkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 400,
    borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
    paddingBottom: '2px',
});

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
                <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <NavLink to="/" style={navLinkStyle} end>Home</NavLink>

                    {user && (
                        <>
                            <NavLink to="/command-center" style={navLinkStyle}>Command Center</NavLink>
                            <NavLink to="/request" style={navLinkStyle}>New Request</NavLink>
                            <NavLink to="/dashboard" style={navLinkStyle}>Dashboard</NavLink>
                            <NavLink to="/hospital-dashboard" style={navLinkStyle}>Hospital Dashboard</NavLink>
                            <NavLink to="/directory" style={navLinkStyle}>Directory</NavLink>
                            <NavLink to="/audit" style={navLinkStyle}>Audit</NavLink>
                            <NavLink to="/profile" style={navLinkStyle}>Profile</NavLink>
                        </>
                    )}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    backgroundColor: 'var(--primary-color)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                }}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.name || user.email}</span>
                            </div>
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
