import React, { useEffect, useRef, useState } from 'react';
import { useDonor } from '../context/DonorContext';
import { requestService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Tracking = () => {
    const { addAuditLog, showToast } = useDonor();
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const directionsRendererRef = useRef(null);
    const [activeRequest, setActiveRequest] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);

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

    // Load Google Maps script dynamically
    const loadGoogleMaps = () => {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
                return;
            }

            const existingScript = document.getElementById('google-maps-script');
            if (existingScript) {
                existingScript.onload = () => resolve(window.google.maps);
                existingScript.onerror = reject;
                return;
            }

            const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                console.error('Google Maps API key is missing. Set REACT_APP_GOOGLE_MAPS_API_KEY in your environment.');
                showToast('Google Maps key missing. Please configure REACT_APP_GOOGLE_MAPS_API_KEY.', 'error');
                reject(new Error('Missing Google Maps API key'));
                return;
            }

            const script = document.createElement('script');
            script.id = 'google-maps-script';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve(window.google.maps);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    useEffect(() => {
        if (!mapContainer.current) return;

        let isCancelled = false;

        const initGoogleMap = async () => {
            try {
                const maps = await loadGoogleMaps();
                if (isCancelled) return;

                // Calculate center point between user and hospital
                const centerLat = (locations.user[0] + locations.hospital[0]) / 2;
                const centerLng = (locations.user[1] + locations.hospital[1]) / 2;

                const map = new maps.Map(mapContainer.current, {
                    center: { lat: centerLat, lng: centerLng },
                    zoom: 12
                });
                mapInstance.current = map;

                const directionsService = new maps.DirectionsService();
                const directionsRenderer = new maps.DirectionsRenderer({
                    map,
                    suppressMarkers: false
                });
                directionsRendererRef.current = directionsRenderer;

                const origin = {
                    lat: locations.hospital[0],
                    lng: locations.hospital[1]
                };
                const destination = {
                    lat: locations.user[0],
                    lng: locations.user[1]
                };

                directionsService.route(
                    {
                        origin,
                        destination,
                        travelMode: maps.TravelMode.DRIVING
                    },
                    (result, status) => {
                        if (status === 'OK' && result && result.routes && result.routes[0] && result.routes[0].legs[0]) {
                            directionsRenderer.setDirections(result);
                            const leg = result.routes[0].legs[0];
                            if (leg.distance && typeof leg.distance.value === 'number') {
                                setDistanceKm(leg.distance.value / 1000);
                            }
                        } else {
                            console.error('Directions request failed due to ' + status);
                        }
                    }
                );
            } catch (err) {
                console.error('Failed to initialize Google Maps:', err);
            }
        };

        initGoogleMap();

        return () => {
            isCancelled = true;
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
                directionsRendererRef.current = null;
            }
            if (mapInstance.current) {
                mapInstance.current = null;
            }
        };
    }, [locations]);

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
                            Transporting <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getResourceDisplay()}</span>
                            {distanceKm !== null && (
                                <>
                                    {' • Distance: '}
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                                        {distanceKm.toFixed(2)} km
                                    </span>
                                </>
                            )}
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
