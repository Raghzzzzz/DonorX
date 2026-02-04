/**
 * DonorX - Core Application Logic
 * Handles data persistence via localStorage and shared utilities.
 */

const STORAGE_KEYS = {
    REQUESTS: 'donorx_requests',
    AUDIT_LOGS: 'donorx_audit_logs'
};

const MOCK_DATA = {
    requests: [
        {
            id: 'REQ-1001',
            patientName: 'Priya Venkatesh',
            bloodGroup: 'O-',
            organType: 'Kidney',
            urgency: 'Critical',
            location: 'Apollo Hospital, Greams Road',
            status: 'Searching',
            timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
            id: 'REQ-1002',
            patientName: 'Rahul Sharma',
            bloodGroup: 'AB+',
            organType: 'None',
            urgency: 'High',
            location: 'Fortis Malar, Adyar',
            status: 'Matched',
            timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
    ],
    logs: [
        {
            id: 'LOG-5001',
            action: 'Request Created',
            details: 'Emergency request REQ-1001 initialized by System',
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'LOG-5002',
            action: 'AI Prioritization',
            details: 'Urgency Score Calculated: 98/100 (Critical) for REQ-1001',
            timestamp: new Date(Date.now() - 3595000).toISOString()
        }
    ]
};

class DonorXApp {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
            console.log('Seeding initial data...');
            this.seedData();
        }
    }

    seedData() {
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(MOCK_DATA.requests));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(MOCK_DATA.logs));
    }

    getRequests() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
    }

    addRequest(request) {
        const requests = this.getRequests();
        const newRequest = {
            ...request,
            id: `REQ-${1000 + requests.length + 1}`,
            status: 'Searching',
            timestamp: new Date().toISOString()
        };

        requests.unshift(newRequest); // Add to top
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

        // Format resource string for log
        let resourceStr = '';
        if (request.resources && request.resources.length > 0) {
            resourceStr = request.resources.map(r => r.type === 'Blood' ? `Blood ${r.group}` : `${r.organ}`).join(', ');
        } else {
            // Fallback
            resourceStr = request.organType !== 'None' ? request.organType : `Blood ${request.bloodGroup}`;
        }

        // Automagically add audit log
        this.addAuditLog('Request Created', `New request ${newRequest.id} for ${newRequest.patientName} (${resourceStr})`);

        // Simulating AI Prioritization
        setTimeout(() => {
            this.addAuditLog('AI Prioritization', `Calculated Urgency: ${request.urgency} for ${newRequest.id}`);
        }, 1500);

        return newRequest;
    }

    getAuditLogs() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    }

    addAuditLog(action, details) {
        const logs = this.getAuditLogs();
        const newLog = {
            id: `LOG-${5000 + logs.length + 1}`,
            action,
            details,
            timestamp: new Date().toISOString()
        };
        logs.unshift(newLog);
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    }

    formatDate(isoString) {
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    /* --- Incoming & Audit Logic --- */

    getIncomingRequests() {
        return [
            {
                id: 'INC-9001',
                patientName: 'Amit Verma',
                bloodGroup: 'B+',
                organType: 'Kidney',
                urgency: 'Critical',
                location: 'General Hospital, Park Town',
                status: 'Pending',
                timestamp: new Date(Date.now() - 1200000).toISOString() // 20 mins ago
            },
            {
                id: 'INC-9003',
                patientName: 'Sarah Thomas',
                bloodGroup: 'O-',
                organType: 'None',
                urgency: 'High',
                location: 'Billroth Hospitals, Aminjikarai',
                status: 'Completed',
                timestamp: new Date(Date.now() - 4500000).toISOString() // 1hr 15m ago
            }
        ];
    }

    getAuditLogsForRequest(requestId) {
        // In a real app, filtering by requestId. 
        // For prototype, we generate specific logs based on ID to simulate "individual blockchain history"
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

        // Add fake timestamps relative to now
        return baseLogs.map((log, i) => ({
            ...log,
            hash: '0x' + Math.random().toString(16).substr(2, 40),
            timestamp: new Date(Date.now() - (10000 * (baseLogs.length - i))).toISOString()
        }));
    }

    /* --- Phase 2 Enhancements --- */

    showToast(message, type = 'default') {
        const container = document.getElementById('toast-container') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = '🔔';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `
            <div style="font-size: 1.25rem;">${icon}</div>
            <div>
                <div style="font-weight: 600; font-size: 0.9rem;">Notification</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    createToastContainer() {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    }

    startSimulation() {
        // Only run simulation if we haven't already
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
                this.showToast(item.msg, item.type);
            }
        }, 8000);
    }
}

// Global instance
const app = new DonorXApp();
// Start background simulation
app.startSimulation();
