let sightings = [];
let map;
let markersLayer = L.layerGroup();

const severityColors = {
    High: '#e53e3e',
    Medium: '#dd6b20',
    Low: '#38a169'
};

// Initialize Application
async function initApp() {
    // Initialize Map centered on UK
    map = L.map('map').setView([54.5, -3.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markersLayer.addTo(map);

    // Load Data from JSON / LocalStorage database
    const saved = localStorage.getItem('elanco_tick_db');
    if (saved) {
        sightings = JSON.parse(saved);
        renderData(sightings);
    } else {
        try {
            const response = await fetch('data.json');
            sightings = await response.json();
            localStorage.setItem('elanco_tick_db', JSON.stringify(sightings));
            renderData(sightings);
        } catch (e) {
            console.error('Could not load data.json', e);
        }
    }
}

// Render Map Markers and Sidebar List
function renderData(dataToRender) {
    markersLayer.clearLayers();
    const listContainer = document.getElementById('sightingsList');
    listContainer.innerHTML = '';

    dataToRender.forEach(s => {
        // 1. Add Map Marker
        const color = severityColors[s.severity] || '#38a169';
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%;"></div>`,
            iconSize: [16, 16]
        });

        const marker = L.marker([s.lat, s.lng], { icon: customIcon })
            .bindPopup(`<b>${s.location}</b><br><i>${s.species}</i><br>Severity: ${s.severity}`);
        markersLayer.addLayer(marker);

        // 2. Add Sidebar List Item
        const item = document.createElement('div');
        item.className = 'p-3 rounded-lg border border-slate-200 hover:border-[#0066B2] cursor-pointer transition flex justify-between items-start';
        item.innerHTML = `
            <div>
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
                    <h4 class="font-bold text-slate-800 text-sm">${s.location}</h4>
                    <span class="text-xs text-slate-500 italic">${s.species}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${s.date}</p>
            </div>
            ${s.isRecent ? '<span class="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Recent</span>' : ''}
        `;
        item.onclick = () => {
            map.setView([s.lat, s.lng], 10);
            marker.openPopup();
        };
        listContainer.appendChild(item);
    });
}

// Filter Functionality
function filterData() {
    const species = document.getElementById('speciesFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const recentOnly = document.getElementById('recentFilter').checked;

    const filtered = sightings.filter(s => {
        if (species !== 'Any' && s.species !== species) return false;
        if (severity !== 'Any' && s.severity !== severity) return false;
        if (recentOnly && !s.isRecent) return false;
        return true;
    });

    renderData(filtered);
}

// Modal Controls
function openReportForm() { document.getElementById('reportModal').classList.remove('hidden'); }
function closeReportForm() { document.getElementById('reportModal').classList.add('hidden'); }

// Form Submission with Database Storage
function submitSighting(e) {
    e.preventDefault();
    const newEntry = {
        id: Date.now().toString(),
        location: document.getElementById('formLocation').value,
        lat: parseFloat(document.getElementById('formLat').value),
        lng: parseFloat(document.getElementById('formLng').value),
        species: document.getElementById('formSpecies').value,
        severity: document.getElementById('formSeverity').value,
        date: new Date().toISOString().split('T')[0],
        isRecent: true,
        notes: "User submitted report."
    };

    sightings.unshift(newEntry);
    localStorage.setItem('elanco_tick_db', JSON.stringify(sightings));
    
    const alertBox = document.getElementById('formAlert');
    alertBox.textContent = 'Sighting successfully saved to database!';
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        closeReportForm();
        alertBox.classList.add('hidden');
        renderData(sightings);
    }, 1200);
}

// Tab Switching
function switchTab(tab) {
    if (tab === 'species') {
        document.getElementById('speciesContent').classList.remove('hidden');
        document.getElementById('preventionContent').classList.add('hidden');
        document.getElementById('tabSpecies').className = 'pb-3 px-4 font-semibold text-sm border-b-2 border-[#003366] text-[#003366]';
        document.getElementById('tabPrevention').className = 'pb-3 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500';
    } else {
        document.getElementById('speciesContent').classList.add('hidden');
        document.getElementById('preventionContent').classList.remove('hidden');
        document.getElementById('tabPrevention').className = 'pb-3 px-4 font-semibold text-sm border-b-2 border-[#003366] text-[#003366]';
        document.getElementById('tabSpecies').className = 'pb-3 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500';
    }
}

window.onload = initApp;