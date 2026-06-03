import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/api';
import { getSocket } from '../services/socket';
import { useDonor } from '../context/DonorContext';
import Modal from '../components/Modal';

const RESOURCE_LABELS = {
    ICU_BED: 'ICU',
    VENTILATOR: 'Vent',
    OXYGEN_CYLINDER: 'O₂',
    AMBULANCE: 'Amb',
};

const BLOOD_COLORS = {
    'O+': '#DC2626', 'O-': '#B91C1C', 'A+': '#2563EB', 'A-': '#1D4ED8',
    'B+': '#059669', 'B-': '#047857', 'AB+': '#7C3AED', 'AB-': '#6D28D9',
};

const HospitalDirectory = () => {
    const { user, showToast } = useDonor();
    const [hospitals, setHospitals] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [consultTarget, setConsultTarget] = useState(null);
    const [consultMessage, setConsultMessage] = useState('');

    useEffect(() => {
        hospitalService.getNetwork()
            .then(({ data }) => setHospitals(Array.isArray(data) ? data : []))
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const filtered = hospitals.filter((h) =>
        h.name?.toLowerCase().includes(search.toLowerCase())
    );

    const sendConsultation = () => {
        if (!consultTarget || !consultMessage.trim()) return;
        const socket = getSocket();
        socket.emit('consultation_request', {
            fromHospitalId: user._id,
            toHospitalId: consultTarget._id,
            message: consultMessage.trim(),
        });
        showToast(`Consultation request sent to ${consultTarget.name}`, 'success');
        setConsultTarget(null);
        setConsultMessage('');
    };

    if (loading) {
        return <div className="container" style={{ padding: '4rem' }}>Loading directory...</div>;
    }

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Hospital Directory</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Search and connect with hospitals on the DonorX network.
            </p>

            <input
                type="text"
                placeholder="Search by hospital name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: '100%',
                    maxWidth: 480,
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '2rem',
                }}
            />

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filtered.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No hospitals found.</p>
                ) : (
                    filtered.map((h) => {
                        const coords = h.location?.coordinates;
                        const latLon = coords?.length === 2
                            ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
                            : '—';

                        return (
                            <div key={h._id} className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                                            <h3 style={{ margin: 0 }}>{h.name}</h3>
                                            {h.activeEmergencies > 0 && (
                                                <span className="badge badge-critical" style={{ fontSize: '0.75rem' }}>
                                                    {h.activeEmergencies} active
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {latLon}
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setConsultTarget(h)}
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        Send Consultation Request
                                    </button>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {(h.inventory || [])
                                        .filter((i) => i.type === 'BLOOD' && i.quantity > 0)
                                        .map((i) => (
                                            <span key={i.group} style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: `${BLOOD_COLORS[i.group] || '#6B7280'}22`,
                                                color: BLOOD_COLORS[i.group] || '#374151',
                                                fontWeight: 600,
                                            }}>
                                                {i.group}: {i.quantity}
                                            </span>
                                        ))}
                                </div>

                                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {(h.resources || []).map((r) => (
                                        <span key={r.resourceType} style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '999px',
                                            background: '#EEF2FF',
                                            color: '#4338CA',
                                        }}>
                                            {RESOURCE_LABELS[r.resourceType] || r.resourceType}: {r.available}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal isOpen={!!consultTarget} onClose={() => setConsultTarget(null)} maxWidth="480px">
                <h3 style={{ margin: '0 0 0.5rem' }}>Consultation Request</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    To: <strong>{consultTarget?.name}</strong>
                </p>
                <textarea
                    value={consultMessage}
                    onChange={(e) => setConsultMessage(e.target.value)}
                    placeholder="Enter your consultation message..."
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'inherit',
                        marginBottom: '1rem',
                    }}
                />
                <button className="btn btn-primary" onClick={sendConsultation} style={{ width: '100%' }}>
                    Send
                </button>
            </Modal>
        </div>
    );
};

export default HospitalDirectory;
