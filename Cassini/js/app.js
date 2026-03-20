const map = L.map('map').setView([43.095, 13.001], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

function getStyleByDangerIndex(index) {
    if (index >= 80) {
        return { color: 'red', weight: 6, className: 'flashing-danger' }; 
    } else if (index >= 50) {
        return { color: '#FF8C00', weight: 5, dashArray: '8, 8' }; 
    } else {
        return { color: '#28a745', weight: 4 }; 
    }
}

// Mock polygons for IFFI zones going to be replaced with real data from Supabase in production
const zonaGialla = [[43.102, 12.993], [43.105, 13.005], [43.102, 13.012], [43.093, 13.010], [43.091, 12.996]];
const zonaRossa = [[43.098, 12.997], [43.101, 13.002], [43.099, 13.008], [43.096, 13.006], [43.094, 13.001]];

L.polygon(zonaGialla, { color: '#F1C40F', fillColor: '#F1C40F', fillOpacity: 0.35, weight: 2 }).addTo(map).bindPopup("<b>IFFI Zone - Yellow</b>");
L.polygon(zonaRossa, { color: '#C0392B', fillColor: '#C0392B', fillOpacity: 0.35, weight: 2 }).addTo(map).bindPopup("<b>IFFI Zone - Red</b>");

// Original mock data to be replaced with real API response in production
const mockApiData = [
    { id: 1, name: "Lower Trail", coords: [[43.085, 12.990], [43.090, 12.995]], dangerIndex: 20, moisture: "40%", rain: "0 mm" },
    { id: 2, name: "Middle Ridge", coords: [[43.090, 12.995], [43.093, 13.000]], dangerIndex: 65, moisture: "60%", rain: "2 mm" },
    { id: 3, name: "Lame Rosse North", coords: [[43.093, 13.000], [43.098, 13.005], [43.102, 13.002]], dangerIndex: 92, moisture: "85%", rain: "15 mm" }
];

function drawTrails() {
    mockApiData.forEach(trail => {
        const pathLine = L.polyline(trail.coords, getStyleByDangerIndex(trail.dangerIndex)).addTo(map);

        if (trail.dangerIndex >= 80) {
            const middleIndex = Math.floor(trail.coords.length / 2);
            const middlePoint = trail.coords[middleIndex];

            const hexIcon = L.divIcon({
                className: 'hex-alert-container',
                html: '<div class="hex-pulse"></div><div class="hex-solid"></div>',
                iconSize: [26, 30], 
                iconAnchor: [13, 15] 
            });

            const hexMarker = L.marker(middlePoint, { icon: hexIcon }).addTo(map);

            const alertHTML = `
                <div style="font-family: Arial; min-width: 200px;">
                    <div style="background: #C0392B; color: white; padding: 8px; text-align: center; font-weight: bold;">
                        CRITICAL ALERT
                    </div>
                    <div style="padding: 10px; background: white;">
                        <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: bold;">${trail.name}</p>
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;">
                            Danger Index: <b style="color: #C0392B; font-size: 16px;">${trail.dangerIndex}/100</b>
                        </p>
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;">
                            Soil Moisture: <b>${trail.moisture || "N/A"}</b>
                        </p>
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;">
                            Rainfall: <b>${trail.rain || "N/A"}</b>
                        </p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 12px 0;">
                        <p style="margin: 0; font-size: 11px; color: #888; text-align: center;">
                            Data Source: Sentinel-1 & Copernicus ECMWF
                        </p>
                    </div>
                </div>
            `;

            hexMarker.bindPopup(alertHTML, { className: 'alert-popup' });
            setTimeout(() => hexMarker.openPopup(), 1000);

        } else {
            pathLine.bindPopup(`<b>${trail.name}</b><br>Conditions: ${trail.dangerIndex}/100`);
        }
    });
}

drawTrails();

/* 
Configuration for real API and Supabase integration - to be implemented in production
const map = L.map('map').setView([43.095, 13.001], 14);

// URl from person 1 API, to be replaced with real endpoint in production
const API_URL = 'https://tuoapp.azurewebsites.net/api/risk'; 
const SUPABASE_URL = 'URL_E_SUPABASE_KETU'; 
const SUPABASE_KEY = 'KEY_E_SUPABASE_KETU';

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

// function to get the data from the API and show the popup with the risk information
async function fetchRiskAndShowPopup(lat, lng, targetLayer) {
    try {
        // Spinner while waiting for API response
        targetLayer.bindPopup('Analisi in corso').openPopup();

        const res = await fetch(`${API_URL}?lat=${lat}&lng=${lng}`); 
        const data = await res.json(); 

        const coloreLevel = {
            'CRITICAL': '#C0392B',
            'MEDIUM':   '#E67E22',
            'LOW':      '#27AE60'
        }; 
        
        const colore = coloreLevel[data.riskLevel] || '#888'; 

        const html = `
            <div style='font-family:Arial; min-width:240px;'>
                <div style='background:${colore};color:white;padding:8px 12px; border-radius:4px 4px 0 0;font-weight:bold;font-size:14px;'>
                    🔴 ALLERTA GEOHIKE — ${data.riskLevel}
                </div>
                <div style='padding:10px 12px;border:1px solid #eee;border-top:none;'>
                    <b>Risk Score: ${data.riskScore}/100</b><br>
                    <hr style='margin:6px 0;'>
                    <small>
                        🏔 Rischio storico IFFI: <b>${data.iffiLevel}</b><br>
                        💧 Umidità suolo: <b>${data.soilMoisture}/100</b> (${data.vvMeanDb} dB)<br>
                        🌧 Precipitazioni: <b>${data.precipitationMmh} mm/h</b><br>
                    </small>
                    <br>
                    <span style='color:#C0392B;font-weight:bold;'>${data.message}</span>
                    <br><br>
                    <span style='color:#888;font-size:11px;'>Fonte: Sentinel-1 · Copernicus ECMWF · Galileo</span>
                </div>
            </div>`; 

        targetLayer.bindPopup(html, { maxWidth: 300 }).openPopup(); 

    } catch (err) {
        console.error('Errore API:', err); 
        targetLayer.bindPopup('<b>API non raggiungibile</b><br>Kontrolloni lidhjen ose CORS.').openPopup(); // [cite: 58]
    }
}

// function to load IFFI zones from Supabase and display them on the map
function loadIFFIZones() {
    fetch(`${SUPABASE_URL}/rest/v1/iffi_zones?select=id,pericolosita,geom`, { // [cite: 75]
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } // [cite: 76]
    })
    .then(r => r.json())
    .then(zone => {
        zone.forEach(zona => {
            const colori = { 'P4': '#C0392B', 'P3': '#E67E22', 'P2': '#F1C40F', 'P1': '#27AE60' }; // [cite: 84]
            const fill = colori[zona.pericolosita] || '#888888'; // [cite: 85]

            L.geoJSON(JSON.parse(zona.geom), { // [cite: 82, 86, 87]
                style: { color: fill, fillColor: fill, fillOpacity: 0.35, weight: 2 } // [cite: 88]
            })
            .addTo(map)
            .bindPopup(`<b>Zona IFFI</b><br>Pericolosità: <b>${zona.pericolosita}</b>`); // [cite: 91]
        });
    })
    .catch(err => console.error('Errore IFFI:', err)); // [cite: 94]
}

// trail mock data just for denmonstration, to be removed in production when real API is integrated
const pathCoords = [[43.093, 13.000], [43.098, 13.005], [43.102, 13.002]];
const hikingPath = L.polyline(pathCoords, { color: '#C0392B', weight: 5 }).addTo(map);

// real time api call on click of the trail, to be implemented in production
hikingPath.on('click', (e) => {
    const center = hikingPath.getCenter(); // [cite: 63]
    fetchRiskAndShowPopup(center.lat, center.lng, hikingPath); // [cite: 64]
});

loadIFFIZones();
*/