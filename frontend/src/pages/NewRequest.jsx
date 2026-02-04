import React, { useState, useRef } from 'react';
import { useDonor } from '../context/DonorContext';
import { requestService } from '../services/api'; // Import API
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const NewRequest = () => {
    const { showToast } = useDonor();
    const navigate = useNavigate();

    // Form State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        patientName: '',
        conditionType: 'Trauma / Accident',
        urgency: '',
        location: { lat: null, lng: null, address: '' }, // Updated structure
        bloodGroup: '',
        bloodQty: 1,
        organType: 'Kidney',
        organQty: 1
    });

    const [selectedResources, setSelectedResources] = useState({
        blood: true,
        organ: false
    });

    // Map Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStatus, setSimStatus] = useState("Initializing geospatial network...");
    const [simDistance, setSimDistance] = useState("0 KM Radius");
    const [simLogs, setSimLogs] = useState(["> System ready..."]);

    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const coverageCircle = useRef(null);

    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            address: 'Current Location'
                        }
                    }));
                    showToast('Location fetched successfully!', 'success');
                },
                (err) => {
                    showToast('Unable to retrieve location.', 'error');
                }
            );
        } else {
            showToast('Geolocation not supported.', 'error');
        }
    };

    const handleNext = () => {
        if (!formData.patientName || !formData.urgency) {
            showToast('Please fill in Patient Name and Urgency.', 'warning');
            return;
        }
        setStep(2);
    };

    const toggleResource = (type) => {
        setSelectedResources(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const simulateAssist = (msg) => {
        // Placeholder for future AI/voice/upload integration – no dummy autofill
        showToast(msg, 'info');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedResources.blood && !selectedResources.organ) {
            showToast('Please select at least one resource (Blood or Organ).', 'warning');
            return;
        }

        if (!formData.location.lat) {
            showToast('Please fetch location coordinates.', 'warning');
            return;
        }

        // Prepare Payload
        const resourceNeeded = {};
        if (selectedResources.blood) {
            if (!formData.bloodGroup) {
                showToast('Please select a blood group.', 'warning');
                return;
            }
            resourceNeeded.type = 'BLOOD';
            resourceNeeded.group = formData.bloodGroup;
            resourceNeeded.quantity = Number(formData.bloodQty) || 1;
        } else if (selectedResources.organ) {
            if (!formData.organType) {
                showToast('Please select an organ type.', 'warning');
                return;
            }
            resourceNeeded.type = 'ORGAN';
            resourceNeeded.group = formData.organType;
            resourceNeeded.quantity = Number(formData.organQty) || 1;
        } else {
            showToast('Please select at least one resource (Blood or Organ).', 'warning');
            return;
        }

        // Validate all required fields
        if (!formData.patientName || formData.patientName.trim() === '') {
            showToast('Please enter a patient name.', 'warning');
            return;
        }

        if (!formData.urgency) {
            showToast('Please select an urgency level.', 'warning');
            return;
        }

        const payload = {
            patientName: formData.patientName.trim(),
            urgency: formData.urgency,
            condition: formData.conditionType,
            resourceNeeded,
            location: {
                lat: formData.location.lat,
                lon: formData.location.lng
            }
        };

        console.log('Sending request payload:', payload);

        try {
            const response = await requestService.create(payload);
            console.log('Request created successfully:', response.data);
            
            // Only start simulation if request was successful
            if (response && response.status === 201) {
                showToast('Emergency request created successfully!', 'success');
                // Start Visual Simulation
                startSimulation();
            }
        } catch (error) {
            console.error('Request creation error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Unknown error occurred';
            
            showToast(`Failed to create request: ${errorMessage}`, 'error');
        }
    };

    const startSimulation = () => {
        setIsSimulating(true);
        // Wait for modal to open
        setTimeout(() => {
            initMap();
        }, 500);
    };

    const initMap = () => {
        if (!mapContainer.current) return;
        if (mapInstance.current) {
            mapInstance.current.remove();
        }

        // Use Actual coords if available, else Chennai default
        const CENTER = formData.location.lat ? [formData.location.lat, formData.location.lng] : [13.0418, 80.2341];

        const map = L.map(mapContainer.current).setView(CENTER, 13);
        mapInstance.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);

        // User Icon
        const userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#D32F2F; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);'></div>",
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        L.marker(CENTER, { icon: userIcon }).addTo(map)
            .bindPopup("Request Origin").openPopup();

        runPhase1(map, CENTER);
    };

    const log = (msg) => {
        setSimLogs(prev => [...prev, `> ${msg}`]);
    };

    const runPhase1 = (map, center) => {
        log("Scanning 5km local radius...");
        setSimDistance("5 KM Scan");

        if (coverageCircle.current) map.removeLayer(coverageCircle.current);

        coverageCircle.current = L.circle(center, {
            color: '#D32F2F',
            fillColor: '#D32F2F',
            fillOpacity: 0.1,
            radius: 0
        }).addTo(map);

        let r = 0;
        const grow = setInterval(() => {
            r += 100;
            if (coverageCircle.current) coverageCircle.current.setRadius(r);

            if (r >= 5000) {
                clearInterval(grow);
                log("No immediate matches in 5km zone.");
                setSimStatus("Waiting for local response...");
                setTimeout(() => runPhase2(map), 2500);
            }
        }, 10);
    };

    const runPhase2 = (map) => {
        setSimStatus("Expanding search to 10km grid...");
        setSimDistance("10 KM Scan");
        log("Authority override: Expanding radius.");

        let r = 5000;
        const grow = setInterval(() => {
            r += 150;
            if (coverageCircle.current) {
                coverageCircle.current.setRadius(r);
                map.fitBounds(coverageCircle.current.getBounds());
            }

            if (r >= 10000) {
                clearInterval(grow);
                showHospitals(map);
            }
        }, 20);
    };

    const showHospitals = (map) => {
        log("Broadcasting to nearby facilities...");
        // Mock Hospitals relative to Center
        const centerLat = formData.location.lat || 13.0418;
        const centerLng = formData.location.lng || 80.2341;

        const HOSPITALS = [
            { name: "Apollo Hospitals", lat: centerLat + 0.02, lng: centerLng + 0.02 },
            { name: "Fortis Malar", lat: centerLat - 0.03, lng: centerLng + 0.01 },
            { name: "MIOT International", lat: centerLat + 0.01, lng: centerLng - 0.04 },
        ];

        const hospitalIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#00796B; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;'></div>",
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        HOSPITALS.forEach((h, i) => {
            setTimeout(() => {
                L.marker([h.lat, h.lng], { icon: hospitalIcon }).addTo(map)
                    .bindPopup(`<b>${h.name}</b><br>Checking inventory...`);
                log(`Paged: ${h.name}`);
            }, i * 400);
        });

        setTimeout(() => {
            setSimStatus("Request Broadcasted!");
            log("System: Request is live. Waiting for acceptance...");
            showToast('Request Live: Tracking Started', 'success');

            setTimeout(() => {
                navigate('/tracking');
            }, 1000);
        }, 3000);
    };

    const getUrgencyStyle = (level) => {
        const isSelected = formData.urgency === level;
        let baseStyle = {
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: isSelected ? 'bold' : 'normal'
        };

        if (isSelected) {
            switch (level) {
                case 'Low': return { ...baseStyle, background: '#ECFDF5', color: '#065F46', borderColor: '#10B981' };
                case 'Medium': return { ...baseStyle, background: '#FFFBEB', color: '#92400E', borderColor: '#F59E0B' };
                case 'High': return { ...baseStyle, background: '#FFF7ED', color: '#9A3412', borderColor: '#F97316' };
                case 'Critical': return { ...baseStyle, background: '#FEF2F2', color: '#991B1B', borderColor: '#EF4444' };
            }
        }
        return baseStyle;
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Create Emergency Request</h2>
                    <span className="badge badge-low">Step {step} of 2</span>
                </div>

                {/* Emergency Assist */}
                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => simulateAssist('Scanning report...')} className="btn"
                        style={{ flex: 1, border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', background: '#FFF5F5' }}>
                        Upload Medical Report
                    </button>
                    <button type="button" onClick={() => simulateAssist('Listening...')} className="btn"
                        style={{ flex: 1, border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', background: '#FFF5F5' }}>
                        Voice Assist
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 ? (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 500 }}>Patient Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={formData.patientName}
                                    onChange={e => updateForm('patientName', e.target.value)}
                                    style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 500 }}>Condition Type</label>
                                <select
                                    value={formData.conditionType}
                                    onChange={e => updateForm('conditionType', e.target.value)}
                                    style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', background: 'white' }}
                                >
                                    <option value="Trauma / Accident">Trauma / Accident</option>
                                    <option value="Surgery">Surgery</option>
                                    <option value="Organ Transplant">Organ Transplant</option>
                                    <option value="Internal Bleeding">Internal Bleeding</option>
                                    <option value="ICU / Critical Care">ICU / Critical Care</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 500 }}>Urgency Level</label>
                                <div className="flex gap-sm">
                                    {['Low', 'Medium', 'High', 'Critical'].map(level => (
                                        <div key={level} style={{ flex: 1 }} onClick={() => updateForm('urgency', level)}>
                                            <div style={getUrgencyStyle(level)}>{level}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="button" onClick={handleNext} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                Next: Resource needed
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 500 }}>What is needed?</label>
                                <div className="flex gap-sm">
                                    <label className={`resource-checkbox ${selectedResources.blood ? 'active' : ''}`} onClick={() => toggleResource('blood')}>
                                        <div className={`custom-check ${selectedResources.blood ? 'checked' : ''}`} style={selectedResources.blood ? { background: '#FFF1F2', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' } : {}}>
                                            Blood
                                        </div>
                                    </label>
                                    <label className={`resource-checkbox ${selectedResources.organ ? 'active' : ''}`} onClick={() => toggleResource('organ')}>
                                        <div className={`custom-check ${selectedResources.organ ? 'checked' : ''}`} style={selectedResources.organ ? { background: '#FFF1F2', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' } : {}}>
                                            Organ
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {selectedResources.blood && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <label style={{ fontWeight: 500 }}>Blood Group</label>
                                        <select
                                            value={formData.bloodGroup}
                                            onChange={e => updateForm('bloodGroup', e.target.value)}
                                            style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'white' }}
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <label style={{ fontWeight: 500 }}>Quantity (Units)</label>
                                        <input type="number" min="1" value={formData.bloodQty} onChange={e => updateForm('bloodQty', e.target.value)}
                                            style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                                    </div>
                                </div>
                            )}

                            {selectedResources.organ && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <label style={{ fontWeight: 500 }}>Organ Type</label>
                                        <select
                                            value={formData.organType}
                                            onChange={e => updateForm('organType', e.target.value)}
                                            style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'white' }}
                                        >
                                            <option value="Kidney">Kidney</option>
                                            <option value="Liver">Liver</option>
                                            <option value="Heart">Heart</option>
                                            <option value="Lungs">Lungs</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <label style={{ fontWeight: 500 }}>Count</label>
                                        <input type="number" min="1" value={formData.organQty} onChange={e => updateForm('organQty', e.target.value)}
                                            style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 500 }}>Hospital Location</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        disabled
                                        placeholder={formData.location.lat ? `Coords: ${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)}` : "Coordinates required"}
                                        style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flex: 1, background: '#f3f4f6' }}
                                    />
                                    <button type="button" onClick={getLocation} className="btn btn-outline" style={{ padding: '0.75rem' }}>
                                        📍 Get Location
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-sm">
                                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Submit Emergency Request</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Map Simulation Modal */}
            <Modal isOpen={isSimulating} onClose={() => { }} maxWidth="600px">
                <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                            <h3 style={{ marginBottom: '0.25rem' }}>Live Search</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{simStatus}</p>
                        </div>
                        <div className={`badge ${simDistance === '10 KM Scan' ? 'badge-high' : 'badge-searching'}`} style={{ transition: 'all 0.3s' }}>
                            {simDistance}
                        </div>
                    </div>

                    <div ref={mapContainer} style={{ height: '400px', width: '100%', borderRadius: '12px', background: '#eee' }}></div>

                    <div style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontFamily: 'monospace', height: '60px', overflowY: 'auto', background: '#F9FAFB', padding: '0.5rem', borderRadius: '6px' }}>
                            {simLogs.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default NewRequest;
