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
                        DonorX is the operating system for connected hospitals — managing blood,
                        organs, ICU resources, and emergency logistics in real time.
                    </p>
                    <div className="flex gap-sm justify-center">
                        <Link to="/command-center" className="btn btn-primary">Open Command Center</Link>
                        <Link to="/request" className="btn btn-secondary">New Emergency Request</Link>
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

                    {/* Feature 3 */}
                    <div className="card">
                        <div
                            style={{ width: '48px', height: '48px', background: '#EDE9FE', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#7C3AED' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                        </div>
                        <h3>Voice Input in Tamil &amp; English</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Speak emergency requests hands-free in Tamil or English — DonorX parses patient details,
                            urgency, and resource needs directly from your voice.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="card">
                        <div
                            style={{ width: '48px', height: '48px', background: '#E0E7FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#4338CA' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </div>
                        <h3>Blockchain Audit Trail</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Every action — request creation, matching, acceptance — is hash-chained into an immutable
                            audit log for full transparency between hospitals.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="card">
                        <div
                            style={{ width: '48px', height: '48px', background: '#FEF3C7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#D97706' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                <path d="M20 3v4" />
                                <path d="M22 5h-4" />
                            </svg>
                        </div>
                        <h3>AI Triage Summary</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Gemini generates a 2-sentence triage brief for receiving hospitals and provides clinical
                            decision support from uploaded reports.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="card">
                        <div
                            style={{ width: '48px', height: '48px', background: '#FEE2E2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#DC2626' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                            </svg>
                        </div>
                        <h3>Smart Blood Compatibility</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Medically accurate donor-recipient blood matching using a full compatibility matrix — not
                            just exact group matches.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
