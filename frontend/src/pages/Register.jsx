import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDonor } from '../context/DonorContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        hospitalName: '',
        role: 'Coordinator',
        location: { lat: '', lng: '' }
    });
    const [error, setError] = useState('');
    const { register, showToast } = useDonor();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    }));
                    showToast('Location fetched successfully!', 'success');
                },
                (err) => {
                    setError('Unable to retrieve location.');
                    console.error(err);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name || !formData.email || !formData.password || !formData.hospitalName) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!formData.location.lat || !formData.location.lng) {
            setError('Please fetch your hospital location.');
            return;
        }

        const result = await register({
            // Backend hospital \"name\" represents the hospital entity
            name: formData.hospitalName,
            email: formData.email,
            password: formData.password,
            location: {
                lat: formData.location.lat,
                lon: formData.location.lng
            }
        });

        if (result.success) {
            showToast('Registration successful! Please login.', 'success');
            navigate('/login');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Register Hospital Account</h2>

                {error && <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="form-control"
                            required
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="hospitalName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hospital Name *</label>
                        <input
                            type="text"
                            id="hospitalName"
                            name="hospitalName"
                            value={formData.hospitalName}
                            onChange={handleChange}
                            className="form-control"
                            required
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-control"
                            required
                            placeholder="hospital@example.com"
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            required
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hospital Location *</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button type="button" onClick={getLocation} className="btn btn-outline" style={{ flex: 1, padding: '0.6rem' }}>
                                📍 Get Current Location
                            </button>
                            {formData.location.lat && (
                                <span style={{ fontSize: '0.9rem', color: 'green' }}>
                                    ✓ {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                                </span>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
                        Register Hospital
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <p>Already have an account?</p>
                    <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
