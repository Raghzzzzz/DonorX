import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { requestService, inventoryService } from '../services/api';
import { useDonor } from '../context/DonorContext';
import { useNavigate } from 'react-router-dom';

const IncomingRequestModal = () => {
    const [request, setRequest] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [inventoryMatch, setInventoryMatch] = useState(null);
    const { showToast } = useDonor();
    const navigate = useNavigate();

    // Poll for incoming requests
    useEffect(() => {
        const poll = setInterval(checkForRequests, 5000); // 5 seconds polling for demo
        return () => clearInterval(poll);
    }, []);

    const checkForRequests = async () => {
        try {
            const { data } = await requestService.getIncoming();
            if (data && data.length > 0) {
                // Just take the first one for MVP
                const incReq = data[0]; // Assuming backend returns array of potential matches

                // If we haven't seen this one yet
                if (!request || request._id !== incReq._id) {
                    setRequest(incReq);
                    setIsOpen(true);
                    checkInventory(incReq);
                    // Play alert sound?
                }
            }
        } catch (error) {
            // silent fail
        }
    };

    const checkInventory = async (req) => {
        try {
            const { data: inventory } = await inventoryService.getInventory();
            const { type, group, quantity } = req.resourceNeeded;

            const match = inventory.find(i =>
                i.type === type && i.group === group && i.quantity >= quantity
            );

            if (match) {
                setInventoryMatch(`Available: ${match.quantity} units (Locker #${Math.floor(Math.random() * 100)})`);
            } else {
                setInventoryMatch('WARNING: Insufficient Inventory found in system records.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRespond = async (status) => {
        if (!request) return;
        try {
            await requestService.respond(request._id, status);
            showToast(status === 'Accept' ? 'Request Accepted! Redirecting...' : 'Request Denied', status === 'Accept' ? 'success' : 'info');
            setIsOpen(false);
            setRequest(null);

            if (status === 'Accept') {
                // Open Google Maps or Navigate to tracking logic
                navigate('/hospital-dashboard'); // Or a specific "Active Missions" page
            }
        } catch (error) {
            showToast('Failed to respond', 'error');
        }
    };

    if (!request) return null;

    return (
        <Modal isOpen={isOpen} onClose={() => { }} maxWidth="600px">
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <h2 style={{ color: '#D32F2F', marginBottom: '0.5rem' }}>🚨 Emergency Request Incoming 🚨</h2>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{request.requestingHospital?.name || "Unknown Hospital"}</p>
                <div style={{ margin: '1.5rem 0', textAlign: 'left', background: '#FFF5F5', padding: '1rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <div className="grid grid-cols-2 gap-4">
                        <div><strong>Patient:</strong> {request.patientName}</div>
                        <div><strong>Urgency:</strong> <span className="badge badge-critical">{request.urgency}</span></div>
                        <div><strong>Condition:</strong> {request.condition}</div>
                        <div><strong>Required:</strong> {request.resourceNeeded.group} {request.resourceNeeded.type} (x{request.resourceNeeded.quantity})</div>
                    </div>
                </div>

                {inventoryMatch && (
                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#ECFDF5', color: '#065F46', borderRadius: '6px', fontWeight: 'bold' }}>
                        ✅ {inventoryMatch}
                    </div>
                )}

                <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Auto-Deny in <span style={{ color: '#D32F2F', fontWeight: 'bold' }}>02:59</span>
                </p>

                <div className="flex gap-4">
                    <button onClick={() => handleRespond('Deny')} className="btn btn-secondary w-full" style={{ borderColor: '#D32F2F', color: '#D32F2F' }}>
                        Deny
                    </button>
                    <button onClick={() => handleRespond('Accept')} className="btn btn-primary w-full" style={{ background: '#059669', borderColor: '#059669' }}>
                        ACCEPT REQUEST
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default IncomingRequestModal;
