import React, { useState, useEffect } from 'react';
import { useDonor } from '../context/DonorContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, updateProfile } = useDonor();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        setFormData(user);
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateProfile(formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData(user);
        setIsEditing(false);
    };

    if (!user) return null;

    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <h1 className="page-title" style={{ marginBottom: '2rem' }}>My Profile</h1>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Profile Card */}
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        margin: '0 auto 1.5rem',
                        fontWeight: 'bold'
                    }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{user.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{user.role || 'Hospital Staff'}</p>
                    <div className="badge badge-success" style={{ display: 'inline-block' }}>Active</div>
                </div>

                {/* Details Section */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Account Details</h3>
                        {!isEditing ? (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsEditing(true)}
                                style={{ minWidth: '100px' }}
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                                />
                            ) : (
                                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.name}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Hospital Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="hospitalName"
                                    value={formData.hospitalName || ''}
                                    onChange={handleChange}
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                                />
                            ) : (
                                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.hospitalName}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Username (ID)</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: '500', fontFamily: 'monospace' }}>{user.username}</p>
                            {isEditing && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cannot be changed</span>}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Role</label>
                            {isEditing ? (
                                <select
                                    name="role"
                                    value={formData.role || 'Coordinator'}
                                    onChange={handleChange}
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                                >
                                    <option value="Coordinator">Transplant Coordinator</option>
                                    <option value="Admin">Hospital Administrator</option>
                                    <option value="Doctor">Doctor/Surgeon</option>
                                </select>
                            ) : (
                                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.role}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Phone Number</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                                />
                            ) : (
                                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.phone || 'Not provided'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
