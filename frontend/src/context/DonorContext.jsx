import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { joinHospitalRoom, disconnectSocket } from '../services/socket';

const DonorContext = createContext();

export const DonorProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        // Restore logged-in user from storage (no mock requests/audit data)
        const storedUser = localStorage.getItem('donorx_user');

        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                if (parsed._id) {
                    joinHospitalRoom(parsed._id);
                }
            } catch (e) {
                console.error("Failed to parse user", e);
                localStorage.removeItem('donorx_user');
            }
        }

        startSimulation();
    }, []);

    const getRegisteredUsers = () => {
        try {
            return JSON.parse(localStorage.getItem('donorx_registered_users') || '[]');
        } catch (e) {
            console.error("Error parsing registered users", e);
            localStorage.removeItem('donorx_registered_users');
            return [];
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await authService.login(email, password);
            // Data should contain user info + token
            setUser(data);
            localStorage.setItem('donorx_user', JSON.stringify(data));
            if (data._id) {
                joinHospitalRoom(data._id);
            }
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please check your credentials.'
            };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await authService.register(userData);
            setUser(data);
            localStorage.setItem('donorx_user', JSON.stringify(data));
            if (data._id) {
                joinHospitalRoom(data._id);
            }
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('donorx_user');
        disconnectSocket();
    };

    const updateProfile = (updatedDetails) => {
        const updatedUser = { ...user, ...updatedDetails };

        // Update in current state
        setUser(updatedUser);
        localStorage.setItem('donorx_user', JSON.stringify(updatedUser));

        // Update in registered users list
        const registeredUsers = getRegisteredUsers();
        const userIndex = registeredUsers.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
            registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...updatedDetails };
            localStorage.setItem('donorx_registered_users', JSON.stringify(registeredUsers));
        }

        showToast('Profile updated successfully!', 'success');
    };

    const addAuditLog = (action, details) => {
        const newLog = {
            id: `LOG-${5000 + auditLogs.length + 1}`,
            action,
            details,
            timestamp: new Date().toISOString()
        };
        const updatedLogs = [newLog, ...auditLogs];
        setAuditLogs(updatedLogs);
    };

    const getAuditLogsForRequest = (requestId) => {
        // Individual Request Log Generation (UI-only mock for blockchain trail)
        const baseLogs = [
            { action: 'Request Generated', details: `Emergency Protocol initialized for ${requestId}` },
            { action: 'Identity Verified', details: 'Patient ID verified against Aadhaar Database' },
            { action: 'AI Prioritization', details: 'Urgency Score Calculated: 92/100' },
            { action: 'Broadcast Sent', details: 'Encrypted broadcast to 5 nearby nodes' }
        ];

        if (requestId.startsWith('INC')) {
            baseLogs.push({ action: 'Incoming Signal', details: 'Received request from external node (General Hospital)' });
        } else {
            baseLogs.push({ action: 'Inventory Check', details: 'Internal stock reserved: Block #492a' });
        }

        // Add timestamps and hash
        return baseLogs.map((log, i) => ({
            ...log,
            hash: '0x' + Math.random().toString(16).substr(2, 40),
            timestamp: new Date(Date.now() - (10000 * (baseLogs.length - i))).toISOString()
        }));
    };

    const showToast = (message, type = 'default') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const startSimulation = () => {
        if (window.simulationStarted) return;
        window.simulationStarted = true;

        const messages = [
            { msg: "New kidney match found in MIOT Hospital, Manapakkam", type: "success" },
            { msg: "High urgency request incoming: O- Blood (Velachery)", type: "warning" },
            { msg: "Transport logistics updated for REQ-1002 (Anna Nagar)", type: "default" },
            { msg: "System health check: Chennai Zone Optimal", type: "default" },
            { msg: "Donor database synchronized with TN Organ Registry", type: "default" }
        ];

        // Random check every 15 seconds
        setInterval(() => {
            if (Math.random() > 0.6) {
                const item = messages[Math.floor(Math.random() * messages.length)];
                showToast(item.msg, item.type);
            }
        }, 8000);
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <DonorContext.Provider value={{
            user,
            auditLogs,
            toasts,
            login,
            register,
            logout,
            updateProfile,
            addAuditLog,
            getAuditLogsForRequest,
            showToast,
            removeToast,
            formatDate
        }}>
            {children}
        </DonorContext.Provider>
    );
};

export const useDonor = () => useContext(DonorContext);
