import React, { useState, useEffect } from 'react';
import { useDonor } from '../context/DonorContext';
import { auditService } from '../services/api';
import Modal from '../components/Modal';

const EVENT_COLORS = {
    MATCHES_FOUND: '#059669',
    REQUEST_ACCEPTED: '#2563EB',
    RADIUS_EXPANDED: '#D97706',
    STATUS_UPDATE_COMPLETED: '#0D9488',
    MATCH_TIMEOUT: '#DC2626',
    NO_MATCH_AFTER_TIMEOUT: '#DC2626',
    NO_MATCH: '#DC2626',
};

const getEventColor = (action) => {
    if (EVENT_COLORS[action]) return EVENT_COLORS[action];
    if (action?.startsWith('STATUS_UPDATE_COMPLETED')) return EVENT_COLORS.STATUS_UPDATE_COMPLETED;
    if (action?.includes('NO_MATCH')) return EVENT_COLORS.NO_MATCH;
    return '#6B7280';
};

const verifyChain = (logs) => {
    if (!logs.length) return false;
    for (let i = 1; i < logs.length; i++) {
        if (logs[i].prevHash !== logs[i - 1].hash) {
            return false;
        }
    }
    return true;
};

const Audit = () => {
    const { formatDate } = useDonor();
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        auditService.getLogs()
            .then(({ data }) => setAuditLogs(Array.isArray(data) ? data : []))
            .catch((err) => console.error('Failed to load audit logs:', err))
            .finally(() => setLoading(false));
    }, []);

    const chainVerified = verifyChain(auditLogs);

    const openLogModal = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const renderTimeline = (logs, onItemClick) => (
        <div className="audit-timeline" style={{ position: 'relative', paddingLeft: '2rem' }}>
            <div
                style={{
                    position: 'absolute',
                    left: '11px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: '#E5E7EB',
                }}
            />
            {logs.map((log, index) => {
                const color = getEventColor(log.action);
                const hashPreview = log.hash ? `${log.hash.slice(0, 12)}...` : '—';

                return (
                    <div
                        key={log._id || index}
                        className="audit-timeline-node"
                        style={{
                            position: 'relative',
                            marginBottom: '1.5rem',
                            cursor: onItemClick ? 'pointer' : 'default',
                        }}
                        onClick={() => onItemClick && onItemClick(log)}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: '-2rem',
                                top: '4px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background: color,
                                border: '2px solid white',
                                boxShadow: `0 0 0 2px ${color}`,
                            }}
                        />
                        <div
                            className="card"
                            style={{
                                padding: '1rem 1.25rem',
                                borderLeft: `3px solid ${color}`,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <strong style={{ fontSize: '1rem' }}>{log.action}</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                    {formatDate(log.timestamp)}
                                </span>
                            </div>
                            <div
                                style={{
                                    marginTop: '0.35rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {hashPreview}
                            </div>
                            {log.payload && (
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

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
                {auditLogs.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                        <span
                            className="badge"
                            style={{
                                background: chainVerified ? '#D1FAE5' : '#FEE2E2',
                                color: chainVerified ? '#065F46' : '#991B1B',
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                            }}
                        >
                            {chainVerified ? '✓ Verified chain' : '✗ Chain integrity broken'}
                        </span>
                    </div>
                )}
            </div>

            <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {loading ? (
                    <p className="text-center">Loading audit trail...</p>
                ) : auditLogs.length === 0 ? (
                    <p className="text-center">No logs found.</p>
                ) : (
                    renderTimeline(auditLogs, openLogModal)
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="600px">
                {selectedLog && (
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>{selectedLog.action}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {formatDate(selectedLog.timestamp)}
                        </p>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#F3F4F6', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', wordBreak: 'break-all' }}>
                            <div><strong>Hash:</strong> {selectedLog.hash}</div>
                            <div style={{ marginTop: '0.5rem' }}><strong>Prev Hash:</strong> {selectedLog.prevHash}</div>
                        </div>
                        {selectedLog.payload && (
                            <pre style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', overflow: 'auto', fontSize: '0.85rem' }}>
                                {JSON.stringify(selectedLog.payload, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Audit;
