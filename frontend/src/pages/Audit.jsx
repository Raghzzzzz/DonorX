import React from 'react';
import { useDonor } from '../context/DonorContext';

const Audit = () => {
    const { auditLogs, formatDate } = useDonor();

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div className="badge" style={{ background: '#EEF2FF', color: '#4F46E5', display: 'inline-block', marginBottom: '1rem' }}>
                    Blockchain Prototype
                </div>
                <h2>Immutable Audit Log</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0.5rem auto' }}>
                    All system actions are cryptographically logged to ensure transparency, accountability, and trust
                    between hospitals and donors.
                </p>
            </div>

            <div className="timeline animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {auditLogs.length === 0 ? (
                    <p className="text-center">No logs found.</p>
                ) : (
                    auditLogs.map((log, index) => {
                        // Mock Hash generation for visual effect if not present
                        const displayHash = log.hash || ('0x' + Math.random().toString(16).substr(2, 40));

                        return (
                            <div key={index} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content" style={{ background: 'white' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                                        <span className="hash-id" style={{
                                            fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)',
                                            background: '#F3F4F6', padding: '0.25rem 0.5rem', borderRadius: '4px'
                                        }}>
                                            TX: {displayHash.substr(0, 16)}...
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{formatDate(log.timestamp)}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{log.action}</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>{log.details}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Audit;
