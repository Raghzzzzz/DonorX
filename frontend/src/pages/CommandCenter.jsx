import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { statsService, hospitalService } from '../services/api';
import { getSocket } from '../services/socket';

const URGENCY_COLORS = {
    Critical: '#DC2626',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#10B981',
};

const RESOURCE_LABELS = {
    ICU_BED: 'ICU Bed',
    VENTILATOR: 'Ventilator',
    OXYGEN_CYLINDER: 'Oxygen',
    AMBULANCE: 'Ambulance',
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const getMarkerColor = (hospital) => {
    const resources = hospital.resources || [];
    if (!resources.length) return '#6B7280';
    const ratios = resources.map((r) => (r.total > 0 ? r.available / r.total : 0));
    const avg = ratios.reduce((a, b) => a + b, 0, 0) / ratios.length;
    if (avg > 0.5) return '#059669';
    if (avg > 0.2) return '#D97706';
    return '#DC2626';
};

const CommandCenter = () => {
    const [stats, setStats] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    const fetchAll = useCallback(async () => {
        try {
            const [statsRes, networkRes] = await Promise.all([
                statsService.getStats(),
                hospitalService.getNetwork(),
            ]);
            setStats(statsRes.data);
            setHospitals(Array.isArray(networkRes.data) ? networkRes.data : []);
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Command center fetch error:', e);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    useEffect(() => {
        const socket = getSocket();
        const refresh = () => fetchAll();
        socket.on('new_request', refresh);
        socket.on('request_accepted', refresh);
        return () => {
            socket.off('new_request', refresh);
            socket.off('request_accepted', refresh);
        };
    }, [fetchAll]);

    useEffect(() => {
        if (!mapRef.current || hospitals.length === 0) return;

        if (mapInstance.current) {
            mapInstance.current.remove();
        }

        const map = L.map(mapRef.current).setView([13.0827, 80.2707], 11);
        mapInstance.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
        }).addTo(map);

        hospitals.forEach((h) => {
            const coords = h.location?.coordinates;
            if (!coords || coords.length < 2) return;

            const color = getMarkerColor(h);
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4)"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
            });

            const bloodSummary = (h.inventory || [])
                .filter((i) => i.type === 'BLOOD' && i.quantity > 0)
                .map((i) => `${i.group}: ${i.quantity}`)
                .join(', ') || 'No blood stock';

            const resourceSummary = (h.resources || [])
                .map((r) => `${RESOURCE_LABELS[r.resourceType] || r.resourceType}: ${r.available}`)
                .join('<br>');

            L.marker([coords[1], coords[0]], { icon })
                .addTo(map)
                .bindPopup(
                    `<b>${h.name}</b><br><small>Blood: ${bloodSummary}</small><br>${resourceSummary}<br>Active: ${h.activeEmergencies || 0}`
                );
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [hospitals]);

    const urgencyChartData = stats?.requestsByUrgency
        ? Object.entries(stats.requestsByUrgency).map(([name, value]) => ({ name, value }))
        : [];

    const bloodChartData = stats?.bloodInventorySummary
        ? Object.entries(stats.bloodInventorySummary).map(([group, units]) => ({ group, units }))
        : [];

    const activeEmergencies = stats?.activeRequests || 0;

    return (
        <div style={{ width: '100%', minHeight: '100vh', background: '#F3F4F6' }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>DonorX</span>
                    <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>Command Center</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{
                        background: activeEmergencies > 0 ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.1)',
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        border: activeEmergencies > 0 ? '1px solid #FCA5A5' : 'none',
                    }}>
                        Active Emergencies: <strong>{activeEmergencies}</strong>
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem' }}>
                        Today: <strong>{stats?.totalRequestsToday ?? '—'}</strong>
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem' }}>
                        Avg Response: <strong>{stats?.averageResponseTimeMinutes ?? 0}m</strong>
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem' }}>
                        Top Blood: <strong>{stats?.topBloodType || '—'}</strong>
                    </span>
                </div>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    Updated {lastUpdated.toLocaleTimeString()}
                </span>
            </div>

            <div style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 1rem' }}>Emergency Activity</h3>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={urgencyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <h4 style={{ margin: '1.5rem 0 0.75rem', fontSize: '0.95rem' }}>Recent Requests</h4>
                    {(stats?.recentRequests || []).length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No recent requests.</p>
                    ) : (
                        stats.recentRequests.map((req) => (
                            <div key={req._id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.6rem 0',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <span className="badge" style={{
                                    background: `${URGENCY_COLORS[req.urgency]}22`,
                                    color: URGENCY_COLORS[req.urgency],
                                    fontSize: '0.75rem',
                                }}>
                                    {req.urgency}
                                </span>
                                <span style={{ fontWeight: 600, flex: 1 }}>{req.patientName}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {req.resourceNeeded?.resourceCategory === 'RESOURCE'
                                        ? req.resourceNeeded.type.replace(/_/g, ' ')
                                        : `${req.resourceNeeded?.group || ''} ${req.resourceNeeded?.type || ''}`}
                                </span>
                                <span className="badge badge-searching" style={{ fontSize: '0.7rem' }}>{req.status}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {formatTimeAgo(req.createdAt)}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 1rem' }}>Resource Overview</h3>
                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {Object.entries(stats?.resourceSummary || {}).map(([type, count]) => {
                            const totalEstimate = count + 10;
                            const pct = Math.min(100, Math.round((count / totalEstimate) * 100));
                            return (
                                <div key={type} style={{
                                    padding: '0.75rem',
                                    background: '#F9FAFB',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {RESOURCE_LABELS[type] || type}
                                        </span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4F46E5' }}>
                                            {count}
                                        </span>
                                    </div>
                                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                                        <div style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: pct > 50 ? '#059669' : pct > 20 ? '#D97706' : '#DC2626',
                                            borderRadius: 3,
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Blood Inventory (Network)</h4>
                    <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bloodChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="group" width={40} />
                                <Tooltip />
                                <Bar dataKey="units" fill="#DC2626" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 2rem 2rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem' }}>Network Map</h3>
                    <div ref={mapRef} style={{ height: 360, borderRadius: '8px', background: '#1f2937' }} />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                        <span><span style={{ color: '#059669' }}>●</span> Available</span>
                        <span><span style={{ color: '#D97706' }}>●</span> Low</span>
                        <span><span style={{ color: '#DC2626' }}>●</span> Critical</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandCenter;
