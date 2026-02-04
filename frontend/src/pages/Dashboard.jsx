import React, { useState, useEffect, useRef } from 'react';
import { useDonor } from '../context/DonorContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { requestService } from '../services/api';

const Dashboard = () => {
    const { getAuditLogsForRequest, showToast, formatDate } = useDonor();
    const navigate = useNavigate();

    // Backend-backed requests
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);

    // Stats
    const activeRequests = outgoingRequests.length;
    const criticalRequests = outgoingRequests.filter(r => r.urgency === 'Critical' || r.urgency === 'High').length;

    // Audit Modal State
    const [isAuditOpen, setAuditOpen] = useState(false);
    const [selectedAuditId, setSelectedAuditId] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);

    // Auto-refresh requests periodically
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [myRes, incRes] = await Promise.all([
                    requestService.getMyRequests(),
                    requestService.getIncoming()
                ]);
                setOutgoingRequests(myRes.data || []);
                setIncomingRequests(incRes.data || []);
            } catch (e) {
                console.error(e);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 10000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll for Audit Modal
    const timelineRef = useRef(null);
    const outgoingRef = useRef(null);

    const scrollToOutgoing = () => {
        outgoingRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isAuditOpen && timelineRef.current) {
            setTimeout(() => {
                timelineRef.current.scrollTo({
                    top: timelineRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [isAuditOpen, auditLogs]);

    const handleOpenAudit = (requestId) => {
        setSelectedAuditId(requestId);
        setAuditLogs(getAuditLogsForRequest(requestId));
        setAuditOpen(true);
    };

    const getResDisplay = (req) => {
        if (!req.resourceNeeded) return '—';
        const { type, group, quantity } = req.resourceNeeded;
        if (type === 'BLOOD') {
            return (
                <div style={{ fontWeight: 500 }}>
                    Blood: {group} ({quantity} Units)
                </div>
            );
        }
        if (type === 'ORGAN') {
            return (
                <div style={{ fontWeight: 500 }}>
                    Organ: {group} (x{quantity})
                </div>
            );
        }
        return '—';
    };

    const getUrgencyClass = (urgency) => {
        switch (urgency) {
            case 'Medium': return 'badge-medium';
            case 'High': return 'badge-high';
            case 'Critical': return 'badge-critical';
            default: return 'badge-low';
        }
    };

    const getStatusClass = (status) => {
        if (status === 'Matched') return 'badge-matched';
        if (status === 'Completed') return 'badge-success';
        if (status === 'Ended') return 'badge-critical';
        return 'badge-searching';
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h2>Live Emergency Dashboard</h2>
                <div className="flex gap-sm">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                        System Operational
                    </span>
                </div>
            </div>

            <div className="stats-grid animate-fade-in">
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--info)' }}>{activeRequests}</div>
                    <div className="stat-label">Active Requests</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{criticalRequests}</div>
                    <div className="stat-label">Critical Priority</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--success)' }}>12m 30s</div>
                    <div className="stat-label">Avg. Match Time</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>98.5%</div>
                    <div className="stat-label">AI Accuracy</div>
                </div>
            </div>

            {/* Incoming Requests */}
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Incoming Requests (Other Hospitals)</h3>
                <button
                    onClick={scrollToOutgoing}
                    className="btn"
                    style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.8rem',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                    }}
                >
                    Outgoing ↓
                </button>
            </div>
            <div className="card table-container animate-fade-in" style={{ padding: 0, marginBottom: '3rem' }}>
                <table className="interactive-table">
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Patient</th>
                            <th>Resource</th>
                            <th>Origin Hospital</th>
                            <th>Urgency</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incomingRequests.map(req => (
                            <tr key={req.id} onClick={() => handleOpenAudit(req.id)} style={{ cursor: 'pointer' }}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{req.requestId || req._id}</td>
                                <td style={{ fontWeight: 600 }}>{req.patientName}</td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{req.organType !== 'None' ? 'Organ: ' + req.organType : 'Blood: ' + req.bloodGroup}</div>
                                </td>
                                <td>{req.requestingHospital?.name || 'Unknown Hospital'}</td>
                                <td><span className={`badge ${getUrgencyClass(req.urgency)}`}>{req.urgency}</span></td>
                                <td><span className={`badge ${getStatusClass(req.status)}`}>{req.status}</span></td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(req.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Outgoing Requests */}
            <div ref={outgoingRef} className="card table-container animate-fade-in" style={{ padding: 0 }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0 }}>Outgoing Requests</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Patient</th>
                            <th>Blood / Organ</th>
                            <th>Location</th>
                            <th>Urgency</th>
                            <th>Status</th>
                            <th>Sent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outgoingRequests.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No active requests found.
                                </td>
                            </tr>
                        ) : (
                            outgoingRequests.map(req => (
                                <tr key={req.id} onClick={() => handleOpenAudit(req.id)} style={{ cursor: 'pointer' }} title="Click to view Audit Log">
                                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{req.requestId || req._id}</td>
                                    <td style={{ fontWeight: 600 }}>{req.patientName || 'Anonymous'}</td>
                                    <td>{getResDisplay(req)}</td>
                                    <td>{req.location ? (req.location.address || 'Origin') : 'Origin'}</td>
                                    <td><span className={`badge ${getUrgencyClass(req.urgency)}`}>{req.urgency}</span></td>
                                    <td><span className={`badge ${getStatusClass(req.status)}`}>{req.status}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(req.createdAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Audit Modal */}
            <Modal isOpen={isAuditOpen} onClose={() => setAuditOpen(false)} maxWidth="800px">
                <div className="flex justify-between items-center"
                    style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', textAlign: 'left' }}>
                    <div>
                        <div className="badge badge-low" style={{ marginBottom: '0.5rem', background: '#EEF2FF', color: '#4F46E5', display: 'inline-block' }}>
                            Blockchain Ledger</div>
                        <h3 style={{ margin: 0 }}>Audit Trail: <span style={{ fontFamily: 'monospace' }}>{selectedAuditId}</span></h3>
                    </div>
                </div>

                <div className="timeline" ref={timelineRef} style={{ textAlign: 'left', maxHeight: '60vh', overflowY: 'auto' }}>
                    {auditLogs.map((log, index) => (
                        <div key={index} className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                                        TX: {log.hash ? log.hash.substr(0, 16) + '...' : ''}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(log.timestamp)}</span>
                                </div>
                                <h4 style={{ margin: '0 0 0.25rem 0' }}>{log.action}</h4>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{log.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Incoming Request Alert Modal removed: real-time alerts handled by global IncomingRequestModal */}
        </div>
    );
};

export default Dashboard;
