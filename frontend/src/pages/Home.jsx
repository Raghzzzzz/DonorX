import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
                <div className="animate-fade-in">
                    <div className="badge badge-low"
                        style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--primary-color)', background: 'rgba(211, 47, 47, 0.1)' }}>
                        Revolutionizing Healthcare Logistics
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                        Connecting lives, <br />
                        <span style={{ color: 'var(--primary-color)' }}>saving time.</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Delayed access to blood and organs costs lives. DonorX bridges the gap with real-time emergency
                        coordination, ensuring critical resources reach patients when they matter most.
                    </p>
                    <div className="flex gap-sm justify-center">
                        <Link to="/request" className="btn btn-primary">Generate Emergency Request</Link>
                        <Link to="/dashboard" className="btn btn-secondary">Request Dashboard</Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container" style={{ padding: '4rem 1rem 8rem' }}>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Feature 1 */}
                    <div className="card">
                        <div
                            style={{ width: '48px', height: '48px', background: '#FEE2E2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path
                                    d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 10 10 0 0 0-4.02-2.59A5.021 5.021 0 0 1 12 2Z" />
                            </svg>
                        </div>
                        <h3>AI urgency prioritization</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Our algorithms analyze patient data to calculate accurate urgency scores, ensuring critical
                            cases get attention first.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="card">
                        <div
                            style={{ width: '48px', height: '48px', background: '#D1FAE5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#059669' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path
                                    d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3v0a2.9 2.9 0 0 0 1.96 3H22l-2.24.75a2.9 2.9 0 0 0-1.96 3v0a2.9 2.9 0 0 0 1.96 3H22l-2.24.75" />
                                <path
                                    d="m2 2 2.24.75a2.9 2.9 0 0 1 1.96 3v0a2.9 2.9 0 0 1-1.96 3H2l2.24.75a2.9 2.9 0 0 1 1.96 3v0a2.9 2.9 0 0 1-1.96 3H2l2.24.75" />
                                <path d="M10 10v4" />
                                <path d="M14 10v4" />
                            </svg>
                        </div>
                        <h3>Real-time Matching</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Instant geo-based matching connects hospitals with the nearest available blood banks and organ
                            donors.
                        </p>
                    </div>


                </div>
            </section>
        </div>
    );
};

export default Home;
