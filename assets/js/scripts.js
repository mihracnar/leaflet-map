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
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteCategory').value = 'Genel';
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
                    duration: 1.5, // Animasyon süresi (saniye cinsinden)
                    easeLinearity: 0.2 // Yumuşaklık (0-1 arası)
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
                            // Modal başlığını 'data.title' ile güncelleyin
                            $('#noteModal .modal-title').text(data.title);
                            $('#noteModal #noteContent').text(data.content);
                            $('#noteModal #noteCategory').text(data.category);
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

        // **Formu temizle (Önemli!)**
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTitle').value = '';
        
        // Popup kapandığında marker'ı kaldır ve butonu devre dışı bırak
        marker.on('popupclose', function () {
            map.removeLayer(marker);
            currentMarker = null;
            toggleButton.disabled = true;
            toggleButton.classList.remove('active');
            toggleButton.setAttribute('aria-pressed', 'false');
            
            // **Formu temizle (Önemli!)**
            document.getElementById('noteContent').value = '';
            document.getElementById('noteTitle').value = '';
            
            // **Kategori seçeneğini varsayılan haline getir**
            document.getElementById('noteCategory').value = 'Genel';
        });
    }
});

// Kategorileri tanımlayın
const categories = ["Genel", "İş", "Kişisel"];

// Dropdown menüsünü dolduracak fonksiyon
function loadCategories() {
    const categorySelect = document.getElementById('noteCategory');
    
    // Mevcut seçenekleri temizle
    categorySelect.innerHTML = "";

    // Kategorileri ekle
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Sayfa yüklendiğinde kategorileri yükle
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();  // Kategorileri sayfa yüklendiğinde yükle
});

// Initialize Bootstrap tabs
var triggerTabList = [].slice.call(document.querySelectorAll('#loginSignupTabs a'))
triggerTabList.forEach(function (triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function (event) {
        event.preventDefault()
        tabTrigger.show()
    })
})

// Handle tab switching from the "Kayıt Ol" and "Giriş Yap" links
document.querySelectorAll('.tab-switch').forEach(function(link) {
    link.addEventListener('click', function(event) {
        event.preventDefault()
        var targetTabId = this.getAttribute('data-bs-target')
        var tab = new bootstrap.Tab(document.querySelector(targetTabId))
        tab.show()
    })
})

// Not ekleme formu
const noteForm = document.getElementById('noteForm');
const noteLocationInput = document.getElementById('noteLocation');
const noteTitleInput = document.getElementById('noteTitle');
const noteCategorySelect = document.getElementById('noteCategory');



 // Supabase ayarları
 const supabaseUrl = 'https://fyprykalancslcxodoge.supabase.co';
 const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5cHJ5a2FsYW5jc2xjeG9kb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY5MDAwNTEsImV4cCI6MjA0MjQ3NjA1MX0.RT7IOmOh_iVrmUexXXRrv8f02NJY2k_i__1W1kCMsDo';
 const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Supabase Auth işlemleri için gerekli fonksiyonlar
async function signUp(email, password, username) {
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) throw authError;

        alert('Kayıt başarılı! Lütfen email adresinizi doğrulayın.');
        $('#loginSignUpModal').modal('hide');
        return authData;
    } catch (error) {
        alert('Kayıt sırasında hata: ' + error.message);
        throw error;
    }
}

async function signIn(email, password) {
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        alert('Giriş başarılı!');
        $('#loginSignUpModal').modal('hide');
        updateUIForAuthenticatedUser(authData.user);
        return authData;
    } catch (error) {
        alert('Giriş sırasında hata: ' + error.message);
        throw error;
    }
}

async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        updateUIForSignedOutUser();
        alert('Çıkış yapıldı');
    } catch (error) {
        alert('Çıkış sırasında hata: ' + error.message);
    }
}

// UI Güncelleme Fonksiyonları
function updateUIForAuthenticatedUser(user) {
    const toggleButton = document.getElementById('toggle-button');
    toggleButton.disabled = false;
    
    // Kullanıcı menüsünü güncelle
    const userButton = document.querySelector('[data-target="#loginSignUpModal"] i');
    userButton.className = 'fas fa-user-check';

    // Notları yeniden yükle
    fetchGeoJSON();
}

function updateUIForSignedOutUser() {
    const toggleButton = document.getElementById('toggle-button');
    toggleButton.disabled = true;
    
    // Kullanıcı menüsünü güncelle
    const userButton = document.querySelector('[data-target="#loginSignUpModal"] i');
    userButton.className = 'fas fa-user-circle';
    
    // Haritadaki tüm notları temizle
    clearMapNotes();
}

// Form event listeners
document.getElementById('signUpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const username = document.getElementById('signUpUsername').value;
    await signUp(email, password, username);
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    await signIn(email, password);
});



 // Not ekleme fonksiyonunu
 document.getElementById('noteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');
    let addNoteModalInstance = null;
    try {
        // Kullanıcı kontrolü
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
            alert('Not eklemek için giriş yapmalısınız!');
            return;
        }

        // Form verilerini al
        const noteContent = document.getElementById('noteContent').value;
        const noteTitle = document.getElementById('noteTitle').value;
        const noteCategory = document.getElementById('noteCategory').value;
        const y_koordinat = parseFloat(document.getElementById('y_koordinat').value);
        const x_koordinat = parseFloat(document.getElementById('x_koordinat').value);

        console.log('Sending note data:', {
            content: noteContent,
            title: noteTitle,
            category: noteCategory,
            location_y: y_koordinat,
            location_x: x_koordinat,
            user_id: user.id
        });

        // Supabase'e veri gönder
        const { data, error } = await supabaseClient
            .from('notes')
            .insert([
                {
                    content: noteContent,
                    title: noteTitle,
                    category: noteCategory,
                    location_y: y_koordinat,
                    location_x: x_koordinat,
                    user_id: user.id
                }
            ]);

        if (error) {
            throw error;
        }

        // Başarılı ekleme sonrası işlemler
        console.log('Note added successfully:', data);
        alert('Not başarıyla eklendi!');
        $('#addNoteModal').modal('hide');
    

        // Haritadaki geçici markeri kaldır
        if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
        }

        // Form alanlarını temizle
        document.getElementById('noteForm').reset();
        
        // Not ekleme butonunu sıfırla
        const toggleButton = document.getElementById('toggle-button');
        toggleButton.disabled = true;
        toggleButton.classList.remove('active');
        toggleButton.setAttribute('aria-pressed', 'false');

        // Haritayı güncelle
        await fetchGeoJSON();

    } catch (error) {
        console.error('Error adding note:', error);
        alert('Not eklenirken bir hata oluştu: ' + error.message);
    }
});
   

// Not getirme fonksiyonunu güncelle
async function fetchGeoJSON() {
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
            console.log('No authenticated user');
            return;
        }

        console.log('Fetching notes for user:', user.id);
        
        const { data, error } = await supabaseClient.rpc('export_to_geojson', {
            user_id_param: user.id
        });

        if (error) {
            throw error;
        }

        if (data) {
            // Clear existing notes
            clearMapNotes();
            
            // Check if data is already an object
            const geojsonData = typeof data === 'string' ? JSON.parse(data) : data;
            
            // Validate GeoJSON structure
            if (!geojsonData.type || !geojsonData.features) {
                throw new Error('Invalid GeoJSON structure');
            }
            
            console.log('Processed GeoJSON data:', geojsonData);
            addGeoJSONToMap(geojsonData);
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
        // Optionally show user-friendly error message
        alert('Notlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
}


// Haritadaki notları temizleme fonksiyonu
function clearMapNotes() {
    map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });
}

function resetUIAfterNoteAdd() {
    toggleButton.disabled = true;
    toggleButton.classList.remove('active');
    toggleButton.setAttribute('aria-pressed', 'false');
    
    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }
    
    noteForm.reset();
}




// Supabase verilerini Leaflet haritasına ekleyen fonksiyon
function addGeoJSONToMap(geojson) {
    console.log('Adding to map:', geojson);

    try {
        L.geoJSON(geojson, {
            pointToLayer: function (feature, latlng) {
                // Validate coordinates
                if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
                    console.error('Invalid coordinates:', latlng);
                    return null;
                }

                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: "##000000", // Fixed color value
                    color: "#ffffff",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function (feature, layer) {
                // Validate feature properties
                if (!feature.properties) {
                    console.error('Missing properties in feature:', feature);
                    return;
                }

                const title = feature.properties.title || 'Untitled';
                const category = feature.properties.category || 'Uncategorized';
                const content = feature.properties.content || 'No content';

                layer.on('click', function () {
                    $('#noteModal .modal-title').text(title);
                    $('#noteModal #noteCategory').text(category);
                    $('#noteModal #noteContent').text(content);
                    $('#noteModal').modal('show');
                });
            }
        }).addTo(map);
    } catch (e) {
        console.error('Error adding GeoJSON to map:', e);
        // Optionally show user-friendly error message
        alert('Harita gösterimi sırasında bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
    }
}


// Sayfa yüklendiğinde mevcut oturum kontrolü
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (user) {
        updateUIForAuthenticatedUser(user);
    } else {
        updateUIForSignedOutUser();
    }
});

fetchGeoJSON();
addGeoJSONToMap();