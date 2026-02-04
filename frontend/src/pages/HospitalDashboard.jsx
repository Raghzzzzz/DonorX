import React, { useState, useEffect } from 'react';
import { useDonor } from '../context/DonorContext';
import { inventoryService } from '../services/api';

const HospitalDashboard = () => {
    const { showToast } = useDonor();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState('name');
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            const { data } = await inventoryService.getInventory();
            // Data is array of { type, group, quantity }
            // Map to UI format
            const mapped = data.map((item, i) => ({
                resource: item.type === 'BLOOD' ? 'Blood' : item.type === 'ORGAN' ? item.group : item.type, // e.g. Kidney
                type: item.group, // e.g. A+ or Kidney
                qty: item.quantity + (item.type === 'BLOOD' ? ' Units' : ' Count'),
                id: `#${1000 + i}`, // Mock ID as backend doesn't perform item-level tracking yet
                status: item.quantity > 0 ? 'Available' : 'Out of Stock',
                rawQty: item.quantity // For sorting
            }));
            setInventory(mapped);
        } catch (error) {
            console.error(error);
            showToast('Failed to load inventory', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddInventory = async () => {
        // Simple prompt for MVP
        const type = prompt("Enter Type (BLOOD/ORGAN):");
        if (!type) return;
        const group = prompt("Enter Group/Organ Name (e.g. A+, Kidney):");
        const qty = prompt("Enter Quantity to ADD:");

        if (type && group && qty) {
            try {
                await inventoryService.updateInventory({
                    items: [{ type: type.toUpperCase(), group: group, quantity: Number(qty) }]
                });
                showToast('Inventory Updated', 'success');
                loadInventory();
            } catch (error) {
                showToast('Update failed', 'error');
            }
        }
    };

    const handleSort = (e) => {
        const type = e.target.value;
        setSortType(type);
        const sorted = [...inventory].sort((a, b) => {
            if (type === 'name') return a.resource.localeCompare(b.resource);
            if (type === 'qty') return (b.rawQty || 0) - (a.rawQty || 0); // High to Low
            if (type === 'status') return a.status.localeCompare(b.status);
            return 0;
        });
        setInventory(sorted);
    };

    const filteredInventory = inventory.filter(item =>
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
                    + Add Resource
                </button>
            </div>

            {/* Inventory Section */}
            <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <h3>Current Stock</h3>
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
                                <th>Locker / ID</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.length > 0 ? filteredInventory.map((item, index) => (
                                <tr key={index}>
                                    <td><span style={{ fontWeight: 600 }}>{item.resource}</span></td>
                                    <td>{item.type}</td>
                                    <td>{item.qty}</td>
                                    <td>{item.id}</td>
                                    <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                                    <td><button className="btn" style={{ padding: '0.2rem 0.5rem', color: 'var(--primary-color)', background: 'transparent' }}>Edit</button></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No inventory found. Add some resources!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
