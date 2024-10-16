const map = L.map('map').setView([41.0082, 28.9784], 13);

const cartoLightLayer = L.tileLayer('https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://carto.com/">Carto</a>',
    maxZoom: 22
}).addTo(map);

const googleMapsSatelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: '© <a href="https://maps.google.com/maps/about/terms/copyright/">Google Maps</a>',
    maxZoom: 22
});

const googleMapsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '© <a href="https://maps.google.com/maps/about/terms/copyright/">Google Maps</a>',
    maxZoom: 22
});

const googleMapsSatelliteHybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '© <a href="https://maps.google.com/maps/about/terms/copyright/">Google Maps</a>',
    maxZoom: 22
});

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22
});

// Katman kontrolünü oluşturma
const layersControl = L.control.layers({
    "Carto Light": cartoLightLayer,
    "Google Maps (Uydu)": googleMapsSatelliteLayer,
    "Google Maps (Uydu Hibrit)": googleMapsSatelliteHybridLayer,
    "Google Maps (Harita)": googleMapsLayer,
    "OpenStreetMap": osmLayer
}, {}, { collapsed: false }); 

// Katman kontrolünü modal içine taşıma
layersControl.addTo(map); 
const layerControlElement = layersControl.getContainer();
document.getElementById('layersModalBody').appendChild(layerControlElement);


// Leaflet'in locate kontrolünü gizli başlat
const locateControl = L.control.locate({
  position: 'topright', // Konum seçeneği
  flyTo: true, // Konuma uçarak git
  showPopup: false, // Popup gösterme
  strings: { // Başlık metni
    title: "Konumuma Git"
  },
  icon: 'fa fa-location-arrow', // İkon sınıfı
  setView: true, // Haritayı konuma otomatik olarak yakınlaştırma
  showMarker: true // Marker gösterme
}).addTo(map);

// Locate kontrolünün butonunu gizle
locateControl.getContainer().style.display = 'none';

// Konum butonu işlevi
const locateButton = document.getElementById('locate-button');
locateButton.addEventListener('click', function() {
// Locate kontrolünü çalıştır
  locateControl.start();
});

// Search Control
const searchControl = new L.Control.Search({
    url: 'https://nominatim.openstreetmap.org/search?&countrycodes=TR&format=json&q={s}',
    jsonpParam: 'json_callback',
    propertyName: 'display_name',
    propertyLoc: ['lat', 'lon'],
    marker: L.circleMarker([0, 0], { radius: 30 }),
    autoCollapse: false,
    autoType: false,
    minLength: 2,
    collapsed: false,
    textPlaceholder: 'Konum ya da koordinat ara'
});

map.addControl(searchControl);

let searchMarker; 

searchControl.on('search:locationfound', function(e) {
    if (searchMarker) {
        map.removeLayer(searchMarker); 
    }
    lat = e.latlng.lat;
    lon = e.latlng.lng;
    searchMarker = L.circleMarker(e.latlng, { radius: 30 }).addTo(map);
});

searchControl.on('search:textentered', function(e) {
    let inputText = e.text.trim();

    const coords = inputText.split(',');
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        lat = parseFloat(coords[0]);
        lon = parseFloat(coords[1]);

        map.setView([lat, lon], 13);

        if (searchMarker) {
            map.removeLayer(searchMarker);
        }
        searchMarker = L.marker([lat, lon]).addTo(map);
    }
});

// Zoom butonları işlevselliği
const zoomInButton = document.getElementById('zoom-in-button');
const zoomOutButton = document.getElementById('zoom-out-button');

zoomInButton.addEventListener('click', function() {
  map.zoomIn();
});

zoomOutButton.addEventListener('click', function() {
  map.zoomOut();
});



// Konum Pini
const blackIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});


// Toggle butonu
const toggleButton = document.getElementById('toggle-button');
const mapDiv = document.getElementById('map');

let currentMarker = null;

// Başlangıçta buton deaktif
toggleButton.disabled = true; // Butonu başlangıçta devre dışı bırak
toggleButton.classList.remove('active');
toggleButton.setAttribute('aria-pressed', 'false');


// Pin varsa buton aktif
toggleButton.addEventListener('click', function () {
    if (toggleButton.classList.contains('active')) {
        mapDiv.style.display = 'none';
        toggleButton.textContent = 'Not Ekle';
    } else {
        if (currentMarker) { // Pin varsa formu göster
          $('#addNoteModal').modal('show');
    } else {
          mapDiv.style.display = 'block';
          toggleButton.textContent = 'Not Ekle';
    }
      }
});

// Harita üzerinde tıklama olayını dinleyin
map.on('click', function (e) {
    const latlng = e.latlng;

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

// Pin Oluştur
const marker = L.marker(latlng, { icon: blackIcon }).addTo(map);
currentMarker = marker;

// Popup ile Pini ilişkilendir
marker.bindPopup(`<b>Konum:</b> ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`).openPopup();


// Pin Butonu etkinleştir
toggleButton.disabled = false; 

// Formdaki konum girdisini güncelleyin
document.getElementById('noteLocation').value = `Lat: ${latlng.lat.toFixed(4)}, Lon: ${latlng.lng.toFixed(4)}`;


// Gizli giriş alanlarını güncelleyin
document.getElementById('y_koordinat').value = latlng.lat;
document.getElementById('x_koordinat').value = latlng.lng;


//Popup, Buton, 
marker.on('popupclose', function () {
    map.removeLayer(marker);
        currentMarker = null;
    toggleButton.disabled = true; // Butonu devre dışı bırak
    toggleButton.classList.remove('active');
    toggleButton.setAttribute('aria-pressed', 'false');
    });
});
 

 // Not ekleme formu
 const noteForm = document.getElementById('noteForm');
 const noteLocationInput = document.getElementById('noteLocation');



 // Supabase ayarları
 const supabaseUrl = 'https://fyprykalancslcxodoge.supabase.co';
 const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5cHJ5a2FsYW5jc2xjeG9kb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY5MDAwNTEsImV4cCI6MjA0MjQ3NjA1MX0.RT7IOmOh_iVrmUexXXRrv8f02NJY2k_i__1W1kCMsDo';
 const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

 noteForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Form verilerini işle (örneğin, not içeriğini al)
    const noteContent = document.getElementById('noteContent').value;
    const y_koordinat = document.getElementById('y_koordinat').value;
    const x_koordinat = document.getElementById('x_koordinat').value;
  
    try {
        // Supabase'e veri gönderme
        const { data, error } = await supabaseClient
            .from('notes')
            .insert([
                { 
                    content: noteContent, 
                    location_y: y_koordinat, 
                    location_x: x_koordinat 
                }
            ]);

        if (error) {
            console.error('Supabase error:', error);
            alert('Not eklenirken bir hata oluştu: ' + error.message);
        } else {
            console.log('Not başarıyla eklendi:', data);
            alert('Not başarıyla eklendi!');
            
            // Modal'ı kapat
            $('#addNoteModal').modal('hide');
            
            // Butonu pasifleştir
            toggleButton.disabled = true;
            toggleButton.classList.remove('active');
            toggleButton.setAttribute('aria-pressed', 'false');
            
            // Pin'i kaldır
            if (currentMarker) {
                map.removeLayer(currentMarker);
                currentMarker = null;
            }
            
            // Formu temizle
            noteForm.reset();
        }
    } catch (err) {
        console.error('Beklenmeyen hata:', err);
        alert('Beklenmeyen bir hata oluştu: ' + err.message);
    }
});