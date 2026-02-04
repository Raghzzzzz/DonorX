import React, { useEffect, useRef, useState } from 'react';
import { useDonor } from '../context/DonorContext';
import { requestService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
// Import separate from map init
import L from 'leaflet';

const Tracking = () => {
    const { addAuditLog, showToast } = useDonor();
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const vehicleMarker = useRef(null);
    const animationRef = useRef(null);
    const [activeRequest, setActiveRequest] = useState(null);

    // Initial Data: Default to Chennai if no data
    const [locations, setLocations] = useState({
        user: [13.0418, 80.2341],
        hospital: [13.1075, 80.2878]
    });

    useEffect(() => {
        const fetchDeep = async () => {
            try {
                const { data } = await requestService.getMyRequests();
                // Prefer a request that has been accepted and is in transit
                const active = data.find(r => r.status === 'Pending') || data[0];
                if (active) {
                    setActiveRequest(active);

                    // Request origin
                    if (active.location && active.location.coordinates) {
                        // Mongo: [lng, lat] -> Leaflet: [lat, lng]
                        const [lng, lat] = active.location.coordinates;
                        setLocations(prev => ({
                            ...prev,
                            user: [lat, lng]
                        }));
                    }

                    // Matched hospital location (if assigned)
                    if (active.assignedHospital && active.assignedHospital.location && active.assignedHospital.location.coordinates) {
                        const [hLng, hLat] = active.assignedHospital.location.coordinates;
                        setLocations(prev => ({
                            ...prev,
                            hospital: [hLat, hLng]
                        }));
                    }
                } else {
                    showToast('No active emergency requests found.', 'info');
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchDeep();
    }, []);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (mapInstance.current) return; // Initialize once

        const map = L.map(mapContainer.current).setView([13.07, 80.26], 12);
        mapInstance.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);

        // User Marker
        const userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#D32F2F; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);'></div>",
            iconSize: [16, 16]
        });
        L.marker(locations.user, { icon: userIcon }).addTo(map).bindPopup("Patient/Origin Location");

        // Hospital Marker
        const hospitalIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#00796B; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);'></div>",
            iconSize: [16, 16]
        });
        L.marker(locations.hospital, { icon: hospitalIcon }).addTo(map).bindPopup("Matched Hospital (Source)");

        // Route Line
        const latlngs = [
            locations.user,
            locations.hospital
        ];
        const routeLine = L.polyline(latlngs, { color: '#3B82F6', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        // Vehicle Marker
        const vehicleIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='font-size: 24px;'>🚑</div>",
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        vehicleMarker.current = L.marker(locations.hospital, { icon: vehicleIcon }).addTo(map);

        // Start Animation
        startAnimation();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [locations]); // Re-run if locations change

    const startAnimation = () => {
        let progress = 0;
        const animate = () => {
            if (progress >= 1) return;
            progress += 0.002;

            const lat = locations.hospital[0] + (locations.user[0] - locations.hospital[0]) * progress;
            const lng = locations.hospital[1] + (locations.user[1] - locations.hospital[1]) * progress;

            if (vehicleMarker.current) {
                vehicleMarker.current.setLatLng([lat, lng]);
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        setTimeout(animate, 1000);
    };

    const getResourceDisplay = () => {
        if (!activeRequest || !activeRequest.resourceNeeded) return "Critical Resources";
        const { type, group, quantity } = activeRequest.resourceNeeded;
        if (type === 'BLOOD') {
            return `${quantity} Units of ${group} Blood`;
        }
        if (type === 'ORGAN') {
            return `${quantity} x ${group}`;
        }
        return 'Critical Resources';
    };

    const completeRequest = async () => {
        if (!activeRequest) return;
        try {
            await requestService.updateStatus(activeRequest._id, 'Completed', {
                completedAt: new Date().toISOString()
            });
            addAuditLog('Delivery Completed', `Resources delivered successfully to ${activeRequest.patientName}`);
            showToast("Delivery Confirmed. Protocol Solved.", "success");
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (e) {
            console.error(e);
            showToast('Failed to update request status.', 'error');
        }
    };

    const denyRequest = async () => {
        if (!activeRequest) {
            navigate('/dashboard');
            return;
        }
        try {
            await requestService.updateStatus(activeRequest._id, 'Ended', {
                cancelledAt: new Date().toISOString()
            });
            addAuditLog('Request Cancelled', `User cancelled request for ${activeRequest.patientName}`);
        } catch (e) {
            console.error(e);
        } finally {
            navigate('/dashboard');
        }
    };

    return (
        <div className="container" style={{ padding: '1rem', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div
                ref={mapContainer}
                className="map-container"
                style={{ height: '60vh', width: '100%', borderRadius: '1rem', zIndex: 1 }}
            ></div>

            <div className="overlay-card animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem',
                    background: 'white', padding: '1.5rem', borderRadius: '1rem',
                    boxShadow: 'var(--shadow-lg)', zIndex: 9999, pointerEvents: 'auto', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto'
                }}>
                <div className="flex items-center gap-md">
                    <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '50%', color: '#059669' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path
                                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>
                            Match Confirmed: {activeRequest?.assignedHospital?.name || 'Matched Hospital'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Transporting <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getResourceDisplay()}</span> • ETA: <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>8 mins</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-sm">
                    <button onClick={denyRequest} className="btn"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--danger)' }}>Deny / Cancel</button>
                    <button onClick={completeRequest} className="btn btn-primary">Mark Delivered</button>
                </div>
            </div>
        </div>
    );
};

export default Tracking;
