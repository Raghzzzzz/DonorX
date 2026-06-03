import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDonor } from '../context/DonorContext';
import { inventoryService, resourceService, hospitalService } from '../services/api';
import { getSocket } from '../services/socket';

const RESOURCE_LABELS = {
    ICU_BED: 'ICU Bed',
    VENTILATOR: 'Ventilator',
    OXYGEN_CYLINDER: 'Oxygen Cylinder',
    AMBULANCE: 'Ambulance',
};

const HospitalDashboard = () => {
    const { showToast } = useDonor();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState('name');
    const [inventory, setInventory] = useState([]);
    const [facilityResources, setFacilityResources] = useState([]);
    const hospitalNamesRef = useRef({});
    const [loading, setLoading] = useState(true);
    const [resourceEdits, setResourceEdits] = useState({});

    const loadInventory = useCallback(async () => {
        try {
            const { data } = await inventoryService.getInventory();
            const mapped = data.map((item, i) => ({
                resource: item.type === 'BLOOD' ? 'Blood' : item.type === 'ORGAN' ? item.group : item.type,
                type: item.group,
                qty: item.quantity + (item.type === 'BLOOD' ? ' Units' : ' Count'),
                id: `#${1000 + i}`,
                status: item.quantity > 0 ? 'Available' : 'Out of Stock',
                rawQty: item.quantity,
            }));
            setInventory(mapped);
        } catch (error) {
            console.error(error);
            showToast('Failed to load inventory', 'error');
        }
    }, [showToast]);

    const loadResources = useCallback(async () => {
        try {
            const { data } = await resourceService.getResources();
            setFacilityResources(Array.isArray(data) ? data : []);
            const edits = {};
            (data || []).forEach((r) => { edits[r.resourceType] = r.available; });
            setResourceEdits(edits);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        Promise.all([loadInventory(), loadResources(), hospitalService.getNetwork()])
            .then(([, , networkRes]) => {
                const names = {};
                (networkRes.data || []).forEach((h) => { names[h._id] = h.name; });
                hospitalNamesRef.current = names;
            })
            .finally(() => setLoading(false));
    }, [loadInventory, loadResources]);

    useEffect(() => {
        const socket = getSocket();

        const onNewRequest = (request) => {
            showToast(`Incoming emergency: ${request.patientName} (${request.urgency})`, 'warning');
        };

        const onConsultation = ({ fromHospitalId, message }) => {
            const name = hospitalNamesRef.current[fromHospitalId] || 'Another hospital';
            const preview = message?.length > 60 ? `${message.slice(0, 60)}...` : message;
            showToast(`Consultation request from ${name}: ${preview}`, 'info');
        };

        socket.on('new_request', onNewRequest);
        socket.on('consultation_incoming', onConsultation);

        return () => {
            socket.off('new_request', onNewRequest);
            socket.off('consultation_incoming', onConsultation);
        };
    }, [showToast]);

    const handleAddInventory = async () => {
        const type = prompt('Enter Type (BLOOD/ORGAN):');
        if (!type) return;
        const group = prompt('Enter Group/Organ Name (e.g. A+, Kidney):');
        const qty = prompt('Enter Quantity to ADD:');

        if (type && group && qty) {
            try {
                await inventoryService.updateInventory({
                    items: [{ type: type.toUpperCase(), group, quantity: Number(qty) }],
                });
                showToast('Inventory Updated', 'success');
                loadInventory();
            } catch (error) {
                showToast('Update failed', 'error');
            }
        }
    };

    const handleUpdateResource = async (resourceType) => {
        const available = Number(resourceEdits[resourceType]);
        if (isNaN(available) || available < 0) {
            showToast('Enter a valid available count', 'warning');
            return;
        }
        try {
            await resourceService.updateResource({ resourceType, available });
            showToast(`${RESOURCE_LABELS[resourceType]} updated`, 'success');
            loadResources();
        } catch (error) {
            showToast('Failed to update resource', 'error');
        }
    };

    const handleSort = (e) => {
        const type = e.target.value;
        setSortType(type);
        const sorted = [...inventory].sort((a, b) => {
            if (type === 'name') return a.resource.localeCompare(b.resource);
            if (type === 'qty') return (b.rawQty || 0) - (a.rawQty || 0);
            if (type === 'status') return a.status.localeCompare(b.status);
            return 0;
        });
        setInventory(sorted);
    };

    const filteredInventory = inventory.filter((item) =>
        item.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        if (status === 'Available') return 'badge-low';
        if (status === 'Out of Stock') return 'badge-critical';
        return 'badge-low';
    };

    if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading Inventory...</div>;

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h2>Hospital Inventory Management</h2>
                <button className="btn btn-primary" onClick={handleAddInventory}>
                    + Add Blood/Organ
                </button>
            </div>

            <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Blood &amp; Organ Inventory</h3>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <div className="flex gap-sm">
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        />
                        <select
                            onChange={handleSort}
                            value={sortType}
                            style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="qty">Sort by Quantity</option>
                            <option value="status">Sort by Status</option>
                        </select>
                    </div>
                </div>
                <div className="table-container">
                    <table style={{ fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th>Resource</th>
                                <th>Type/Group</th>
                                <th>Quantity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.length > 0 ? filteredInventory.map((item, index) => (
                                <tr key={index}>
                                    <td><span style={{ fontWeight: 600 }}>{item.resource}</span></td>
                                    <td>{item.type}</td>
                                    <td>{item.qty}</td>
                                    <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No inventory found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card animate-fade-in">
                <h3 style={{ marginBottom: '1rem' }}>Facility Resources</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {facilityResources.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No facility resources configured.</p>
                    ) : (
                        facilityResources.map((r) => {
                            const utilPct = r.total > 0 ? Math.round(((r.total - r.available) / r.total) * 100) : 0;
                            return (
                                <div key={r.resourceType} style={{
                                    padding: '1rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    background: '#FAFAFA',
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                        {RESOURCE_LABELS[r.resourceType] || r.resourceType}
                                    </div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4F46E5' }}>
                                        {r.available}
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                            {' '}/ {r.total} available
                                        </span>
                                    </div>
                                    <div style={{ margin: '0.5rem 0', height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                                        <div style={{
                                            width: `${utilPct}%`,
                                            height: '100%',
                                            background: utilPct > 80 ? '#DC2626' : utilPct > 50 ? '#D97706' : '#059669',
                                            borderRadius: 3,
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        {utilPct}% utilized
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={resourceEdits[r.resourceType] ?? r.available}
                                            onChange={(e) => setResourceEdits((prev) => ({
                                                ...prev,
                                                [r.resourceType]: e.target.value,
                                            }))}
                                            style={{
                                                flex: 1,
                                                padding: '0.4rem',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                            }}
                                        />
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                            onClick={() => handleUpdateResource(r.resourceType)}
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
