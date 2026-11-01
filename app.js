let sightings = [];
let map;
let markersLayer = L.layerGroup();

const colors = { High: '#e53e3e', Medium: '#dd6b20', Low: '#38a169' };

async function initApp() {
    map = L.map('map', { zoomControl: false }).setView([54.0, -3.0], 6);
    L.control.zoom({ position: 'topleft' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    markersLayer.addTo(map);

    const saved = localStorage.getItem('elanco_tick_db');
    if (saved) {
        sightings = JSON.parse(saved);
        render(sightings);
    } else {
        const res = await fetch('data.json');
        sightings = await res.json();
        localStorage.setItem('elanco_tick_db', JSON.stringify(sightings));
        render(sightings);
    }
}

function render(data) {
    markersLayer.clearLayers();
    const list = document.getElementById('sightingsList');
    list.innerHTML = data.length ? '' : '<p class="text-xs text-slate-400 text-center py-4">No results found.</p>';

    data.forEach(s => {
        const color = colors[s.severity] || '#38a169';
        
        const marker = L.marker([s.lat, s.lng], {
            icon: L.divIcon({ className: 'custom-marker', html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;"></div>`, iconSize: [14, 14] })
        }).bindPopup(`<b>${s.location}</b><br>${s.species} (${s.severity})<br>${s.notes || ''}`);
        
        markersLayer.addLayer(marker);

        const item = document.createElement('div');
        item.className = 'p-3 rounded-lg bg-white border hover:border-[#0066B2] cursor-pointer text-xs space-y-1 shadow-2xs transition';
        item.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-slate-900">${s.location}</span>
                <span class="font-bold px-1.5 py-0.5 rounded text-[10px] text-white" style="background:${color}">${s.severity} Risk</span>
            </div>
            <div class="text-slate-500 italic">${s.species} • Reported on ${s.date}</div>
            <p class="text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">📝 ${s.notes || 'No additional observation notes provided.'}</p>
        `;
        item.onclick = () => { map.setView([s.lat, s.lng], 9); marker.openPopup(); };
        list.appendChild(item);
    });
}

function filterData() {
    const sp = document.getElementById('speciesFilter').value;
    const sev = document.getElementById('severityFilter').value;
    const rec = document.getElementById('recentFilter').checked;

    render(sightings.filter(s => (sp === 'Any' || s.species === sp) && (sev === 'Any' || s.severity === sev) && (!rec || s.isRecent)));
}

function openForm() { document.getElementById('reportModal').classList.remove('hidden'); }
function closeForm() { document.getElementById('reportModal').classList.add('hidden'); }

function submitSighting(e) {
    e.preventDefault();
    sightings.unshift({
        id: Date.now().toString(),
        location: document.getElementById('formLocation').value,
        lat: parseFloat(document.getElementById('formLat').value),
        lng: parseFloat(document.getElementById('formLng').value),
        species: document.getElementById('formSpecies').value,
        severity: document.getElementById('formSeverity').value,
        date: new Date().toISOString().split('T')[0],
        isRecent: true,
        notes: document.getElementById('formNotes').value || "User submitted surveillance report."
    });

    localStorage.setItem('elanco_tick_db', JSON.stringify(sightings));
    closeForm();
    render(sightings);
    e.target.reset();
}

window.onload = initApp;