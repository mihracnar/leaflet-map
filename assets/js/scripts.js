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

// Harita üzerinde tıklama olayını dinle
map.on('click', function (e) {
    const clickedPoint = e.latlng;
    let clickedExistingMarker = false;
    
    // Haritadaki tüm katmanları kontrol et
    map.eachLayer(function(layer) {
        // Eğer layer bir CircleMarker ise (mevcut notlar)
        if (layer instanceof L.CircleMarker) {
            const markerLatLng = layer.getLatLng();
            // Tıklanan nokta ile marker arasındaki mesafeyi hesapla (metre cinsinden)
            const distance = clickedPoint.distanceTo(markerLatLng);
            
            // Eğer tıklanan nokta marker'a yeterince yakınsa (örn: 20 metre)
            if (distance < 20) {
                clickedExistingMarker = true;
                
                // Haritayı marker'ın konumuna yumuşak bir şekilde taşı
                map.flyTo(markerLatLng, 15, {
                    animate: true,
                    duration: 3 // Animasyon süresi (saniye)
                });
                
                // Mevcut notun modalını aç
                // Supabase'den bu konumdaki notu çek
                supabaseClient
                    .from('notes')
                    .select('*')
                    .eq('location_y', markerLatLng.lat)
                    .eq('location_x', markerLatLng.lng)
                    .single()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Error fetching note:', error);
                            return;
                        }
                        if (data) {
                            $('#noteModal .modal-title').text('Not Detayı');
                            $('#noteModal #noteContent').text(data.content);
                            $('#noteModal').modal('show');
                        }
                    });
            }
        }
    });
    
    // Eğer mevcut bir marker'a tıklanmadıysa, yeni pin ekle
    if (!clickedExistingMarker) {
        // Eğer önceden eklenmiş geçici bir marker varsa onu kaldır
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        // Yeni marker oluştur
        const marker = L.marker(clickedPoint, { icon: blackIcon }).addTo(map);
        currentMarker = marker;
        
        // Popup ile marker'ı ilişkilendir
        marker.bindPopup(`<b>Konum:</b> ${clickedPoint.lat.toFixed(4)}, ${clickedPoint.lng.toFixed(4)}`).openPopup();
        
        // Not ekleme butonunu etkinleştir
        toggleButton.disabled = false;
        
        // Form alanlarını güncelle
        document.getElementById('noteLocation').value = `Lat: ${clickedPoint.lat.toFixed(4)}, Lon: ${clickedPoint.lng.toFixed(4)}`;
        document.getElementById('y_koordinat').value = clickedPoint.lat;
        document.getElementById('x_koordinat').value = clickedPoint.lng;
        
        // Popup kapandığında marker'ı kaldır ve butonu devre dışı bırak
        marker.on('popupclose', function () {
            map.removeLayer(marker);
            currentMarker = null;
            toggleButton.disabled = true;
            toggleButton.classList.remove('active');
            toggleButton.setAttribute('aria-pressed', 'false');
        });
    }
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
            
            // Verileri tekrar çekip haritayı güncelle
            fetchGeoJSON();
        }
    } catch (err) {
        console.error('Beklenmeyen hata:', err);
        alert('Beklenmeyen bir hata oluştu: ' + err.message);
    }
});
   

// Supabase'den verileri çekme
    async function fetchGeoJSON() {
        console.log('Fetching data from Supabase...');
        
        let { data, error } = await supabaseClient.from('notes').select('*'); 
        
        if (error) {
            console.error('Error fetching GeoJSON:', error);
            return;
        }

        console.log("Supabase verileri: ", data);

        if (data.length > 0) {
            addGeoJSONToMap(data);
        } else {
            console.log('No data returned from Supabase');
            return;
        }
    }

// Supabase verilerini Leaflet haritasına ekleyen fonksiyon
function addGeoJSONToMap(geojson) {
    console.log('Adding to map:', geojson);

    try {
        geojson.forEach(note => {
            const location = [note.location_y, note.location_x];

            // Tüm notlar için mavi daire kullanın
            const circleMarker = L.circleMarker(location, {
                radius: 8,
                fillColor: "a9a9a9",
                color: "#ffffff", // Siyah kenarlık
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map); 
            // Marker'a tıklama olayını dinleyin
            circleMarker.on('click', function() {
                // Modal'ı açın
                $('#noteModal .modal-title').text('Not Detayı');
                $('#noteModal #noteContent').text(note.content);
                $('#noteModal').modal('show');
            });
        });
    } catch (e) {
        console.error('Error adding GeoJSON to map:', e);
    }
}

// Fetch işlemini başlat
fetchGeoJSON();
