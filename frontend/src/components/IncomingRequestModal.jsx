import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { requestService, inventoryService } from '../services/api';
import { useDonor } from '../context/DonorContext';
import { useNavigate } from 'react-router-dom';

const IncomingRequestModal = () => {
    const [request, setRequest] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [inventoryMatch, setInventoryMatch] = useState(null);
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
    const lastShownRequestIdRef = useRef(null);
    const { showToast, user } = useDonor();
    const navigate = useNavigate();

    const checkForRequests = async () => {
        try {
            const { data } = await requestService.getIncoming();
            if (data && data.length > 0) {
                const incReq = data[0];
                if (lastShownRequestIdRef.current !== incReq._id) {
                    lastShownRequestIdRef.current = incReq._id;
                    setRequest(incReq);
                    setIsOpen(true);
                    checkInventory(incReq);
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

            const match = inventory && inventory.find(i =>
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

    // Poll for incoming requests: run immediately, then every 3s so second device sees new requests quickly
    useEffect(() => {
        checkForRequests();
        const poll = setInterval(checkForRequests, 3000);
        return () => clearInterval(poll);
    }, []);

    // 3-minute timer countdown
    useEffect(() => {
        if (!isOpen || !request) return;

        setTimeLeft(180); // Reset to 3 minutes when modal opens

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoDeny();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, request]);

    const handleAutoDeny = async () => {
        if (!request) return;
        try {
            await requestService.respond(request._id, 'Deny');
            showToast('Request auto-denied after 3 minutes', 'warning');
            setIsOpen(false);
            setRequest(null);
        } catch (error) {
            console.error('Auto-deny error:', error);
        }
    };

    const handleRespond = async (status) => {
        if (!request) return;
        try {
            console.log('Responding to request:', { requestId: request._id, status, hospitalId: user?._id });
            const response = await requestService.respond(request._id, status);
            console.log('Response received:', response.data);
            
            showToast(status === 'Accept' ? 'Request Accepted! Redirecting...' : 'Request Denied', status === 'Accept' ? 'success' : 'info');
            setIsOpen(false);
            setRequest(null);
            setTimeLeft(180); // Reset timer

            if (status === 'Accept') {
                // Refresh the page data by triggering a reload or navigate to tracking
                // The tracking page will fetch the updated request
                setTimeout(() => {
                    navigate('/tracking');
                }, 1000);
            } else {
                // If denied, stay on current page but refresh incoming requests
                // The polling will pick up the change
            }
        } catch (error) {
            console.error('Failed to respond:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to respond';
            showToast(`Failed to respond: ${errorMessage}`, 'error');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    Auto-Deny in <span style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: '1.1rem' }}>{formatTime(timeLeft)}</span>
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
