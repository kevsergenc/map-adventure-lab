import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { countryService, latLonToVector3, vector3ToLatLon } from './countryService.js';
import { TravelerCharacter } from './character.js';
import { sounds } from './audio.js';

// --- APPLICATION STATE ---
const GLOBE_RADIUS = 20;
let scene, camera, renderer, controls;
let earthMesh, cloudsMesh, atmosphereMesh, borderMesh;
let character;
let waypoints = [];
let targetCountry = null;
let currentDirection = null; // 'N', 'NE', etc.
let isAutoWalking = false;
let askOnBorder = true;
let walkSpeedMultiplier = 1.0;
let cameraMode = 'follow'; // 'follow', 'orbit', 'focus'
const visitedCountries = new Map(); // id -> { name, name_tr, capital, continent, date }

// Active language: 'tr' or 'en'
let currentLang = 'tr';

// Direction angle mapping
const DIR_HEADINGS = {
  'N': 0,
  'NE': 45,
  'E': 90,
  'SE': 135,
  'S': 180,
  'SW': 225,
  'W': 270,
  'NW': 315
};

const DIR_LABELS = {
  'N': { tr: 'Kuzey', en: 'North' },
  'NE': { tr: 'Kuzeydoğu', en: 'Northeast', code_tr: 'KD', code_en: 'NE' },
  'E': { tr: 'Doğu', en: 'East' },
  'SE': { tr: 'Güneydoğu', en: 'Southeast', code_tr: 'GD', code_en: 'SE' },
  'S': { tr: 'Güney', en: 'South' },
  'SW': { tr: 'Güneybatı', en: 'Southwest', code_tr: 'GB', code_en: 'SW' },
  'W': { tr: 'Batı', en: 'West' },
  'NW': { tr: 'Kuzeybatı', en: 'Northwest', code_tr: 'KB', code_en: 'NW' }
};

const CONTINENT_NAMES = {
  'Asya': { tr: 'Asya', en: 'Asia' },
  'Avrupa': { tr: 'Avrupa', en: 'Europe' },
  'Afrika': { tr: 'Afrika', en: 'Africa' },
  'Kuzey Amerika': { tr: 'Kuzey Amerika', en: 'North America' },
  'Güney Amerika': { tr: 'Güney Amerika', en: 'South America' },
  'Okyanusya': { tr: 'Okyanusya', en: 'Oceania' },
  'Antarktika': { tr: 'Antarktika', en: 'Antarctica' }
};

const POPULAR_CHIPS = {
  jp: { tr: 'Japonya', en: 'Japan', query_tr: 'Japonya', query_en: 'Japan' },
  br: { tr: 'Brezilya', en: 'Brazil', query_tr: 'Brezilya', query_en: 'Brazil' },
  eg: { tr: 'Mısır', en: 'Egypt', query_tr: 'Mısır', query_en: 'Egypt' },
  fr: { tr: 'Fransa', en: 'France', query_tr: 'Fransa', query_en: 'France' },
  us: { tr: 'ABD', en: 'USA', query_tr: 'Amerika Birleşik Devletleri', query_en: 'United States' },
  au: { tr: 'Avustralya', en: 'Australia', query_tr: 'Avustralya', query_en: 'Australia' },
  za: { tr: 'G. Afrika', en: 'S. Africa', query_tr: 'Güney Afrika', query_en: 'South Africa' },
  it: { tr: 'İtalya', en: 'Italy', query_tr: 'İtalya', query_en: 'Italy' }
};

const I18N = {
  tr: {
    appTitle: 'Dünya Gezgini & Bayrak T-Shirt',
    camFollow: '🎥 Gezgin Takip',
    camOrbit: '🌐 Serbest Küre',
    camFocus: '👕 T-Shirt Odak',
    camFollowTitle: 'Karakteri yakından takip et',
    camOrbitTitle: 'Küre etrafında serbest dön',
    camFocusTitle: 'T-Shirt bayrağına yakın çekim',
    passport: '🛂 Pasaport',
    soundOn: 'Ses: Açık',
    soundOff: 'Ses: Kapalı',
    currentLocation: 'Mevcut Konum',
    live: 'CANLI',
    oceanName: 'Açık Deniz',
    oceanDesc: 'Uluslararası Okyanus Suları',
    latLabel: 'ENLEM',
    lonLabel: 'BOYLAM',
    northShort: 'K (N)',
    southShort: 'G (S)',
    eastShort: 'D (E)',
    westShort: 'B (W)',
    tshirtTitle: 'T-Shirt Tasarımı',
    tshirtCaption: 'Ayak basılan toprağın bayrağı anlık işlenir',
    speakerName: 'Gezgin Karakter',
    tabCompass: '🧭 Yön Pusulası',
    tabDest: '✈️ Hedef Ülke Seç',
    searchPlaceholder: 'Bir ülke adı yazın (örn. Japonya, Brezilya, Mısır)...',
    btnGo: 'Git 🚀',
    popularRoutes: 'Popüler Rotalar:',
    btnPause: '⏸️ Durdur',
    btnResume: '▶️ Devam Et',
    btnRandom: '🎲 Rastgele Macera',
    checkAskBorder: 'Yeni sınırda bana sor',
    speedLabel: 'Hız:',
    toastTitle: 'Yeni Ülkeye Adım Atıldı!',
    toastDesc: 'T-shirt bayrak deseni güncellendi',
    hintControls: 'Farenizle tıklayarak veya yön tuşlarıyla yürütün • Farenizle küreyi döndürebilirsiniz',
    passportModalTitle: 'Gezgin Pasaportu & Damgalar',
    passportModalDesc: 'Ziyaret ettiğiniz tüm ülkelerin t-shirt tasarımları ve pasaport vizeleri burada toplanır:',
    listenBtnTitle: 'Adını Dinle'
  },
  en: {
    appTitle: 'World Explorer & Flag T-Shirt',
    camFollow: '🎥 Follow Explorer',
    camOrbit: '🌐 Free Orbit',
    camFocus: '👕 T-Shirt Focus',
    camFollowTitle: 'Follow character closely',
    camOrbitTitle: 'Free orbit around the globe',
    camFocusTitle: 'Close-up on T-Shirt flag',
    passport: '🛂 Passport',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Off',
    currentLocation: 'Current Location',
    live: 'LIVE',
    oceanName: 'Open Ocean',
    oceanDesc: 'International Waters',
    latLabel: 'LAT',
    lonLabel: 'LON',
    northShort: 'N',
    southShort: 'S',
    eastShort: 'E',
    westShort: 'W',
    tshirtTitle: 'T-Shirt Design',
    tshirtCaption: 'Flag of the visited territory is rendered in real time',
    speakerName: 'Traveler Character',
    tabCompass: '🧭 Compass',
    tabDest: '✈️ Choose Destination',
    searchPlaceholder: 'Type a country name (e.g. Japan, Brazil, Egypt)...',
    btnGo: 'Go 🚀',
    popularRoutes: 'Popular Routes:',
    btnPause: '⏸️ Pause',
    btnResume: '▶️ Resume',
    btnRandom: '🎲 Random Adventure',
    checkAskBorder: 'Ask me at borders',
    speedLabel: 'Speed:',
    toastTitle: 'Stepped onto New Country!',
    toastDesc: 'T-shirt flag updated',
    hintControls: 'Click on the globe or use arrow keys / WASD to walk • Drag to rotate globe',
    passportModalTitle: 'Traveler Passport & Stamps',
    passportModalDesc: 'All visited countries and passport visas are collected here:',
    listenBtnTitle: 'Listen to pronunciation'
  }
};

// --- INITIALIZE THREE.JS SCENE ---
async function init() {
  const container = document.getElementById('canvas-container');

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 15, 45);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 21.5;
  controls.maxDistance = 120;
  controls.rotateSpeed = 0.6;

  // Lighting
  setupLights();

  // Starfield
  createStarfield();

  // Earth Globe & Textures
  setupGlobe();

  // Character
  character = new TravelerCharacter(GLOBE_RADIUS);
  scene.add(character.group);

  // Load Countries GeoJSON
  const countries = await countryService.load();
  if (countries.length > 0) {
    borderMesh = countryService.createBorderLinesMesh(GLOBE_RADIUS + 0.02);
    scene.add(borderMesh);
    populateDatalist(countries);
  }

  // Initial detection & setup in Turkey
  const initialCountry = countryService.findCountry(character.lat, character.lon);
  if (initialCountry) {
    character.setCountry(initialCountry);
    recordVisit(initialCountry);
    updateLocationHUD(initialCountry);
  }

  // Setup UI Listeners & Interactions
  setupUI();
  setupClickToWalk();
  setupGlobeHover();
  setupKeyboardControls();

  // Set default initial language
  setLanguage('tr');

  // Resize handler
  window.addEventListener('resize', onWindowResize);

  // Animation Loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();

    // Rotate clouds gently
    if (cloudsMesh) {
      cloudsMesh.rotation.y += 0.0002;
    }

    // Update character physics and animations
    updateMovement(delta);
    character.update(delta, time);

    // Update Camera according to mode
    updateCamera();

    // Update T-shirt preview canvas in HUD
    updateTShirtHUDPreview();

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

// --- LIGHTING ---
function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(80, 50, 100);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 250;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
  fillLight.position.set(-80, -30, -80);
  scene.add(fillLight);
}

// --- STARFIELD ---
function createStarfield() {
  const starCount = 3500;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  const starColors = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#bfdbfe'),
    new THREE.Color('#fef08a'),
    new THREE.Color('#93c5fd')
  ];

  for (let i = 0; i < starCount; i++) {
    const r = THREE.MathUtils.randFloat(300, 750);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const c = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

// --- GLOBE & ATMOSPHERE ---
function setupGlobe() {
  const textureLoader = new THREE.TextureLoader();

  // 1. Earth Body
  const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
  const earthMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/earth_atmos_2048.jpg'),
    roughness: 0.7,
    metalness: 0.05
  });

  textureLoader.load('/textures/earth_specular_2048.jpg', (specMap) => {
    earthMat.roughnessMap = specMap;
    earthMat.needsUpdate = true;
  });

  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.receiveShadow = true;
  scene.add(earthMesh);

  // 2. Floating Clouds
  const cloudsGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.1, 64, 64);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/textures/earth_clouds_1024.png'),
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
  scene.add(cloudsMesh);

  // 3. Atmospheric Glow
  const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 1.2, 48, 48);
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
        gl_FragColor = vec4(0.22, 0.65, 1.0, 1.0) * intensity * 1.5;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  });

  atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
  scene.add(atmosphereMesh);
}

// --- MOVEMENT PHYSICS ---
function updateMovement(delta) {
  if (!isAutoWalking && waypoints.length === 0) {
    character.isWalking = false;
    return;
  }

  character.isWalking = true;
  const baseSpeed = 12.0 * walkSpeedMultiplier;

  // MODE A: Following Great-Circle Waypoints to a Destination
  if (waypoints.length > 0) {
    const nextWp = waypoints[0];

    const vCurr = latLonToVector3(character.lat, character.lon, 1);
    const vNext = latLonToVector3(nextWp.lat, nextWp.lon, 1);
    const angle = vCurr.angleTo(vNext);

    const stepAngle = (baseSpeed * Math.PI / 180) * delta;

    if (angle <= stepAngle || angle < 0.005) {
      character.lat = nextWp.lat;
      character.lon = nextWp.lon;
      waypoints.shift();

      if (waypoints.length === 0) {
        onArrivalAtDestination();
      }
    } else {
      const t = stepAngle / angle;
      const vInterp = vCurr.clone().lerp(vNext, t).normalize();
      const newCoords = vector3ToLatLon(vInterp, 1);

      const dLat = nextWp.lat - character.lat;
      const dLon = nextWp.lon - character.lon;
      let targetHeading = Math.atan2(dLon, dLat) * (180 / Math.PI);
      if (targetHeading < 0) targetHeading += 360;

      character.heading = targetHeading;
      character.lat = newCoords.lat;
      character.lon = newCoords.lon;
    }
  }
  // MODE B: Continuous Directional Walk
  else if (currentDirection && isAutoWalking) {
    const heading = DIR_HEADINGS[currentDirection];
    character.heading = heading;

    const rad = heading * (Math.PI / 180);
    const stepDeg = baseSpeed * delta;

    const dLat = Math.cos(rad) * stepDeg;
    const cosLat = Math.max(0.1, Math.cos(character.lat * Math.PI / 180));
    const dLon = (Math.sin(rad) * stepDeg) / cosLat;

    character.lat = Math.max(-85, Math.min(85, character.lat + dLat));
    character.lon += dLon;

    while (character.lon < -180) character.lon += 360;
    while (character.lon > 180) character.lon -= 360;
  }

  character.updatePosition();
  checkCountryAtFeet();
}

// --- COUNTRY DETECTION & VOICE PRONUNCIATION ---
let lastAnnouncedCountryId = null;

function checkCountryAtFeet() {
  const country = countryService.findCountry(character.lat, character.lon);
  const currentId = country ? country.id : 'ocean';

  character.setCountry(country);
  updateLocationHUD(country);

  // If the human character steps onto a new country/territory
  if (currentId !== lastAnnouncedCountryId) {
    lastAnnouncedCountryId = currentId;

    if (country) {
      recordVisit(country);
      showCountryToast(country);

      // VOICE PRONUNCIATION: Only when the human character steps on that country!
      sounds.speakCountry(country, currentLang);

      // Prompt if enabled
      if (askOnBorder && isAutoWalking && waypoints.length === 0) {
        pauseWalk();
        promptUserForNextDirection(country);
      }
    } else {
      // In Open Ocean
      updateSpeechBubble(
        currentLang === 'tr'
          ? '🌊 Açık Deniz / Uluslararası Sulara adım attım! T-shirt\'üm dalgalı okyanus tasarımı oldu. Şimdi hangi yöne yelken açalım?'
          : '🌊 Stepped into the Open Ocean / International Waters! My T-shirt turned into an ocean wave design. Where shall we sail next?'
      );
    }
  }
}

function promptUserForNextDirection(country) {
  const flagEmoji = getFlagEmoji(country.id);
  const name = currentLang === 'tr' ? (country.name_tr || country.name) : (country.name || country.name_tr);

  updateSpeechBubble(
    currentLang === 'tr'
      ? `Vay canına! <strong>${name}</strong> topraklarına ayak bastım! ${flagEmoji} T-shirt'üm hemen <strong>${name}</strong> bayrağına dönüştü! Şimdi hangi yöne devam etmemi istersin?`
      : `Wow! I stepped onto <strong>${name}</strong> territory! ${flagEmoji} My T-shirt instantly transformed into the flag of <strong>${name}</strong>! Which direction should we head next?`
  );
}

function onArrivalAtDestination() {
  isAutoWalking = false;
  character.celebrate();

  const country = countryService.findCountry(character.lat, character.lon);
  if (country) {
    // Pronounce on arrival
    sounds.speakCountry(country, currentLang);

    const flag = getFlagEmoji(country.id);
    const name = currentLang === 'tr' ? (country.name_tr || country.name) : (country.name || country.name_tr);
    updateSpeechBubble(
      currentLang === 'tr'
        ? `🎉 Harika! Hedefimize vardık: <strong>${name}</strong> ${flag}! T-shirt'üm gururla dalgalanıyor. Sıradaki durağımız neresi olsun?`
        : `🎉 Awesome! We reached our destination: <strong>${name}</strong> ${flag}! My T-shirt proudly shows its flag. Where next?`
    );
  } else {
    updateSpeechBubble(
      currentLang === 'tr'
        ? `🎉 Hedef koordinata ulaştık! Şimdi nereye gitmek istersin?`
        : `🎉 Arrived at target coordinates! Where would you like to travel next?`
    );
  }

  document.getElementById('btn-toggle-walk').textContent =
    currentLang === 'tr' ? I18N.tr.btnResume : I18N.en.btnResume;
}

// --- RECORD VISIT / PASSPORT ---
function recordVisit(country) {
  if (!visitedCountries.has(country.id)) {
    visitedCountries.set(country.id, {
      ...country,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    document.getElementById('visited-counter').textContent =
      `${visitedCountries.size} / ${countryService.countries.length || 177}`;

    renderPassportStamps();
  }
}

function renderPassportStamps() {
  const grid = document.getElementById('passport-grid');
  grid.innerHTML = '';

  visitedCountries.forEach((c) => {
    const stamp = document.createElement('div');
    stamp.className = 'passport-stamp';
    const primaryName = currentLang === 'tr' ? (c.name_tr || c.name) : (c.name || c.name_tr);
    const secondaryName = currentLang === 'tr' ? c.name : (c.name_tr || '');

    stamp.innerHTML = `
      <img class="stamp-flag" src="https://flagcdn.com/w160/${c.id}.png" alt="${primaryName}" onerror="this.style.display='none'">
      <span class="stamp-name">${primaryName}</span>
      ${secondaryName ? `<span class="stamp-en">${secondaryName}</span>` : ''}
      <span class="stamp-date">🕒 ${c.date}</span>
    `;

    stamp.addEventListener('click', () => {
      sounds.speakCountry(c, currentLang);
    });

    grid.appendChild(stamp);
  });
}

// --- CAMERA FOLLOW & VIEW MODES ---
function updateCamera() {
  if (cameraMode === 'orbit') return;

  const charPos = character.group.position;
  const normal = charPos.clone().normalize();

  if (cameraMode === 'follow') {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.group.quaternion);
    const camOffset = normal.clone().multiplyScalar(4.0).sub(forward.clone().multiplyScalar(7.5));
    const targetCamPos = charPos.clone().add(camOffset);

    camera.position.lerp(targetCamPos, 0.08);
    controls.target.lerp(charPos.clone().add(normal.clone().multiplyScalar(1.2)), 0.08);
  } else if (cameraMode === 'focus') {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.group.quaternion);
    const camOffset = forward.clone().multiplyScalar(2.4).add(normal.clone().multiplyScalar(0.9));
    const targetCamPos = charPos.clone().add(camOffset);

    camera.position.lerp(targetCamPos, 0.1);
    controls.target.lerp(charPos.clone().add(normal.clone().multiplyScalar(0.9)), 0.1);
  }
}

// --- UI UPDATES & LOCALIZATION ---
function updateLocationHUD(country) {
  const flagContainer = document.getElementById('flag-container');
  const nameEl = document.getElementById('country-name');
  const infoEl = document.getElementById('country-info');
  const latEl = document.getElementById('coord-lat');
  const lonEl = document.getElementById('coord-lon');

  const dict = I18N[currentLang];

  const latDir = character.lat >= 0 ? dict.northShort : dict.southShort;
  const lonDir = character.lon >= 0 ? dict.eastShort : dict.westShort;
  latEl.textContent = `${Math.abs(character.lat).toFixed(2)}° ${latDir}`;
  lonEl.textContent = `${Math.abs(character.lon).toFixed(2)}° ${lonDir}`;

  if (country) {
    flagContainer.innerHTML = `
      <img id="country-flag" class="country-flag-img" src="https://flagcdn.com/w320/${country.id}.png" alt="${country.name}">
    `;

    const displayName = currentLang === 'tr' ? (country.name_tr || country.name) : (country.name || country.name_tr);
    const continentTrans = CONTINENT_NAMES[country.continent]
      ? CONTINENT_NAMES[country.continent][currentLang]
      : (country.continent || 'World');

    nameEl.innerHTML = `
      <span>${displayName}</span>
      <button id="btn-replay-voice" class="voice-pill-btn" title="${dict.listenBtnTitle}">
        <span class="speaker-icon">🔊</span>
        <span class="en-name">${displayName}</span>
      </button>
    `;
    infoEl.textContent = `${country.capital || '-'} • ${continentTrans}`;

    const replayBtn = document.getElementById('btn-replay-voice');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        sounds.speakCountry(country, currentLang);
      });
    }
  } else {
    flagContainer.innerHTML = `
      <div class="ocean-flag-icon">🌊</div>
    `;
    nameEl.textContent = dict.oceanName;
    infoEl.textContent = dict.oceanDesc;
  }
}

function updateTShirtHUDPreview() {
  const previewCanvas = document.getElementById('tshirt-canvas-preview');
  if (!previewCanvas || !character.tshirtCanvas) return;
  const ctx = previewCanvas.getContext('2d');
  ctx.drawImage(character.tshirtCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
}

function updateSpeechBubble(html) {
  const el = document.getElementById('speech-msg');
  if (el) el.innerHTML = html;
}

function showCountryToast(country) {
  const toast = document.getElementById('country-toast');
  const flagEl = document.getElementById('toast-flag');
  const titleEl = document.getElementById('toast-title');
  const descEl = document.getElementById('toast-desc');

  const dict = I18N[currentLang];
  const flagEmoji = getFlagEmoji(country.id);
  const displayName = currentLang === 'tr' ? (country.name_tr || country.name) : (country.name || country.name_tr);

  flagEl.textContent = flagEmoji;
  titleEl.innerHTML = `${displayName} <span class="toast-voice-badge">🔊</span>`;
  descEl.textContent = dict.toastDesc;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode === 'ocean') return '🌊';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// --- LANGUAGE SWITCHER IMPLEMENTATION ---
function setLanguage(lang) {
  currentLang = lang;

  document.getElementById('btn-lang-tr').classList.toggle('active', lang === 'tr');
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');

  const dict = I18N[lang];

  // Header & Title
  document.getElementById('txt-logo-title').textContent = dict.appTitle;
  document.getElementById('cam-follow').textContent = dict.camFollow;
  document.getElementById('cam-follow').title = dict.camFollowTitle;
  document.getElementById('cam-orbit').textContent = dict.camOrbit;
  document.getElementById('cam-orbit').title = dict.camOrbitTitle;
  document.getElementById('cam-focus').textContent = dict.camFocus;
  document.getElementById('cam-focus').title = dict.camFocusTitle;
  document.getElementById('txt-passport-btn').textContent = dict.passport;
  document.getElementById('sound-text').textContent = sounds.enabled ? dict.soundOn : dict.soundOff;

  // Location Card
  document.getElementById('txt-loc-header').textContent = dict.currentLocation;
  document.getElementById('txt-live-badge').textContent = dict.live;
  document.getElementById('txt-lat-label').textContent = dict.latLabel;
  document.getElementById('txt-lon-label').textContent = dict.lonLabel;

  // T-Shirt Card
  document.getElementById('txt-tshirt-header').textContent = dict.tshirtTitle;
  document.getElementById('tshirt-caption').textContent = dict.tshirtCaption;

  // Speaker name
  document.getElementById('txt-speaker-name').textContent = dict.speakerName;

  // Tabs
  document.getElementById('tab-btn-compass').textContent = dict.tabCompass;
  document.getElementById('tab-btn-destination').textContent = dict.tabDest;

  // Compass text
  document.getElementById('dir-txt-n').textContent = DIR_LABELS['N'][lang];
  document.getElementById('dir-txt-s').textContent = DIR_LABELS['S'][lang];
  document.getElementById('dir-txt-e').textContent = DIR_LABELS['E'][lang];
  document.getElementById('dir-txt-w').textContent = DIR_LABELS['W'][lang];
  document.getElementById('dir-txt-ne').textContent = DIR_LABELS['NE'][`code_${lang}`];
  document.getElementById('dir-txt-nw').textContent = DIR_LABELS['NW'][`code_${lang}`];
  document.getElementById('dir-txt-se').textContent = DIR_LABELS['SE'][`code_${lang}`];
  document.getElementById('dir-txt-sw').textContent = DIR_LABELS['SW'][`code_${lang}`];

  // Destination Search
  document.getElementById('destination-input').placeholder = dict.searchPlaceholder;
  document.getElementById('btn-go-dest').textContent = dict.btnGo;
  document.getElementById('txt-popular-routes').textContent = dict.popularRoutes;

  // Update Popular Chips Text
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    const chipData = POPULAR_CHIPS[id];
    if (chipData) {
      const nameSpan = btn.querySelector('.chip-name');
      if (nameSpan) nameSpan.textContent = chipData[lang];
    }
  });

  // Dock Footer
  const toggleBtn = document.getElementById('btn-toggle-walk');
  toggleBtn.textContent = isAutoWalking ? dict.btnPause : dict.btnResume;
  document.getElementById('btn-random-dest').textContent = dict.btnRandom;
  document.getElementById('txt-ask-border').textContent = dict.checkAskBorder;
  document.getElementById('txt-speed-label').textContent = dict.speedLabel;

  // Toast
  document.getElementById('toast-title').textContent = dict.toastTitle;
  document.getElementById('toast-desc').textContent = dict.toastDesc;

  // Controls Hint
  document.getElementById('txt-controls-hint').textContent = dict.hintControls;

  // Passport Modal
  document.getElementById('txt-passport-modal-title').textContent = dict.passportModalTitle;
  document.getElementById('txt-passport-modal-desc').textContent = dict.passportModalDesc;

  // Re-populate datalist in current language
  if (countryService.countries.length > 0) {
    populateDatalist(countryService.countries);
  }

  // Update current Location HUD
  const currentCountry = countryService.findCountry(character.lat, character.lon);
  updateLocationHUD(currentCountry);

  // Update Speech Bubble for current language
  if (currentCountry) {
    const flag = getFlagEmoji(currentCountry.id);
    const name = lang === 'tr' ? (currentCountry.name_tr || currentCountry.name) : (currentCountry.name || currentCountry.name_tr);
    updateSpeechBubble(
      lang === 'tr'
        ? `Merhaba! Şu an ${name} topraklarındayım. ${flag} T-shirt'üm ${name} bayrağı oldu! Şimdi nereye gitmemi istersin?`
        : `Hello! I am currently in ${name}. ${flag} My T-shirt is now the flag of ${name}! Where would you like to travel next?`
    );
  }

  // Re-render passport stamps
  renderPassportStamps();
}

// --- GLOBE HOVER (VISUAL ONLY - NO AUDIO ON MOUSE MOVE) ---
function setupGlobeHover() {
  const tooltip = document.getElementById('globe-hover-tooltip');
  const tooltipFlag = document.getElementById('tooltip-flag');
  const tooltipName = document.getElementById('tooltip-name');
  const tooltipSub = document.getElementById('tooltip-sub');

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let isPointerDown = false;
  let isDragging = false;
  let pointerDownPos = { x: 0, y: 0 };
  let lastMoveTime = 0;

  window.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    isDragging = false;
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
    isDragging = false;
  });

  window.addEventListener('pointerleave', () => {
    hideTooltip();
    document.body.style.cursor = 'default';
  });

  window.addEventListener('pointermove', (e) => {
    if (isPointerDown) {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 5) {
        isDragging = true;
        hideTooltip();
        return;
      }
    }

    if (e.target.closest('.glass-panel') || e.target.closest('.modal-overlay')) {
      hideTooltip();
      document.body.style.cursor = 'default';
      return;
    }

    const now = performance.now();
    if (now - lastMoveTime < 25) return;
    lastMoveTime = now;

    if (!earthMesh) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthMesh);

    if (intersects.length > 0 && !isDragging) {
      const hitPoint = intersects[0].point;
      const coords = vector3ToLatLon(hitPoint, GLOBE_RADIUS);
      const country = countryService.findCountry(coords.lat, coords.lon);

      if (country) {
        // Visual tooltip display ONLY - No sound during mouse movement
        showTooltip(e.clientX, e.clientY, country);
        document.body.style.cursor = 'pointer';
      } else {
        hideTooltip();
        document.body.style.cursor = 'default';
      }
    } else {
      hideTooltip();
      document.body.style.cursor = 'default';
    }
  });

  function showTooltip(x, y, country) {
    if (!tooltip) return;
    tooltipFlag.src = `https://flagcdn.com/w80/${country.id}.png`;
    tooltipFlag.alt = country.name;

    const primaryName = currentLang === 'tr' ? (country.name_tr || country.name) : (country.name || country.name_tr);
    const secondaryName = currentLang === 'tr' ? country.name : (country.name_tr || '');
    const continentTrans = CONTINENT_NAMES[country.continent]
      ? CONTINENT_NAMES[country.continent][currentLang]
      : (country.continent || '');

    tooltipName.textContent = primaryName;
    tooltipSub.textContent = secondaryName ? `${secondaryName} • ${continentTrans}` : continentTrans;

    const pad = 16;
    let posX = x + pad;
    let posY = y + pad;
    if (posX + 240 > window.innerWidth) posX = x - 250;
    if (posY + 60 > window.innerHeight) posY = y - 70;

    tooltip.style.left = `${posX}px`;
    tooltip.style.top = `${posY}px`;
    tooltip.classList.add('visible');
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }
}

// --- USER INTERFACE ACTIONS ---
function setupUI() {
  // Language Switch Buttons
  document.getElementById('btn-lang-tr').addEventListener('click', () => setLanguage('tr'));
  document.getElementById('btn-lang-en').addEventListener('click', () => setLanguage('en'));

  // Tabs Switcher
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Compass Direction Buttons
  const dirBtns = document.querySelectorAll('.dir-btn');
  dirBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-dir');
      setCompassDirection(dir);
    });
  });

  // Destination Search
  const destInput = document.getElementById('destination-input');
  document.getElementById('btn-go-dest').addEventListener('click', () => {
    const query = destInput.value.trim();
    if (query) navigateToCountryByName(query);
  });
  destInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = destInput.value.trim();
      if (query) navigateToCountryByName(query);
    }
  });

  // Quick Chips
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const chipData = POPULAR_CHIPS[id];
      if (chipData) {
        const query = currentLang === 'tr' ? chipData.query_tr : chipData.query_en;
        navigateToCountryByName(query);
      }
    });
  });

  // Stop / Resume Toggle
  const toggleWalkBtn = document.getElementById('btn-toggle-walk');
  toggleWalkBtn.addEventListener('click', () => {
    if (isAutoWalking) {
      pauseWalk();
    } else {
      resumeWalk();
    }
  });

  // Random Adventure Button
  document.getElementById('btn-random-dest').addEventListener('click', () => {
    chooseRandomCountry();
  });

  // Ask on Border Toggle
  const askCheck = document.getElementById('check-ask-border');
  askCheck.addEventListener('change', (e) => {
    askOnBorder = e.target.checked;
  });

  // Speed Multiplier Buttons
  document.querySelectorAll('.speed-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      walkSpeedMultiplier = parseFloat(btn.getAttribute('data-speed'));
      character.speed = walkSpeedMultiplier;
    });
  });

  // Camera Mode Switchers
  const camBtns = {
    'cam-follow': 'follow',
    'cam-orbit': 'orbit',
    'cam-focus': 'focus'
  };
  Object.entries(camBtns).forEach(([btnId, mode]) => {
    document.getElementById(btnId).addEventListener('click', () => {
      document.querySelectorAll('.cam-btn').forEach((b) => b.classList.remove('active'));
      document.getElementById(btnId).classList.add('active');
      cameraMode = mode;
      controls.autoRotate = false;
    });
  });

  // Sound Toggle
  document.getElementById('btn-sound').addEventListener('click', () => {
    const enabled = sounds.toggle();
    document.getElementById('sound-icon').textContent = enabled ? '🔊' : '🔇';
    const dict = I18N[currentLang];
    document.getElementById('sound-text').textContent = enabled ? dict.soundOn : dict.soundOff;
  });

  // Passport Modal
  const passportModal = document.getElementById('passport-modal');
  document.getElementById('btn-passport').addEventListener('click', () => {
    passportModal.classList.add('open');
  });
  document.getElementById('btn-close-passport').addEventListener('click', () => {
    passportModal.classList.remove('open');
  });
  passportModal.addEventListener('click', (e) => {
    if (e.target === passportModal) passportModal.classList.remove('open');
  });
}

function setCompassDirection(dir) {
  currentDirection = dir;
  waypoints = [];
  isAutoWalking = true;
  document.getElementById('btn-toggle-walk').textContent =
    currentLang === 'tr' ? I18N.tr.btnPause : I18N.en.btnPause;

  const dirName = DIR_LABELS[dir] ? DIR_LABELS[dir][currentLang] : dir;
  updateSpeechBubble(
    currentLang === 'tr'
      ? `🧭 <strong>${dirName}</strong> yönüne doğru yürüyüşe başladım! Yol boyunca geçtiğim tüm ülkelerin bayrakları t-shirt'üme yansıyacak.`
      : `🧭 Started walking towards <strong>${dirName}</strong>! All countries passed along the way will reflect on my T-shirt.`
  );
}

function pauseWalk() {
  isAutoWalking = false;
  document.getElementById('btn-toggle-walk').textContent =
    currentLang === 'tr' ? I18N.tr.btnResume : I18N.en.btnResume;
}

function resumeWalk() {
  if (!currentDirection && waypoints.length === 0) {
    currentDirection = 'E';
  }
  isAutoWalking = true;
  document.getElementById('btn-toggle-walk').textContent =
    currentLang === 'tr' ? I18N.tr.btnPause : I18N.en.btnPause;
}

function navigateToCountryByName(nameQuery) {
  const q = nameQuery.toLowerCase().trim();
  const found = countryService.countries.find(
    (c) =>
      c.name_tr.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      c.id.toLowerCase() === q ||
      c.name_tr.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
  );

  if (!found) {
    updateSpeechBubble(
      currentLang === 'tr'
        ? `⚠️ "${nameQuery}" adında bir ülke bulunamadı. Lütfen listeden veya arama önerilerinden seçin.`
        : `⚠️ Country "${nameQuery}" was not found. Please select from the list or suggestions.`
    );
    return;
  }

  const targetLon = (found.bbox[0] + found.bbox[2]) / 2;
  const targetLat = (found.bbox[1] + found.bbox[3]) / 2;

  waypoints = countryService.getGreatCirclePath(character.lat, character.lon, targetLat, targetLon, 120);
  currentDirection = null;
  isAutoWalking = true;
  document.getElementById('btn-toggle-walk').textContent =
    currentLang === 'tr' ? I18N.tr.btnPause : I18N.en.btnPause;

  const flagEmoji = getFlagEmoji(found.id);
  const displayName = currentLang === 'tr' ? (found.name_tr || found.name) : (found.name || found.name_tr);

  updateSpeechBubble(
    currentLang === 'tr'
      ? `🚀 Rota oluşturuldu! <strong>${displayName}</strong> ${flagEmoji} yönüne doğru kıtaları aşarak yürüyorum. Yol üzerindeki tüm ülkelerin bayrakları anlık olarak T-shirt'üme yansıyacak!`
      : `🚀 Route created! Walking across continents toward <strong>${displayName}</strong> ${flagEmoji}. All country flags along the path will update my T-shirt!`
  );
}

function chooseRandomCountry() {
  if (!countryService.countries.length) return;
  const randIndex = Math.floor(Math.random() * countryService.countries.length);
  const randCountry = countryService.countries[randIndex];
  const query = currentLang === 'tr' ? randCountry.name_tr : randCountry.name;
  navigateToCountryByName(query);
}

function populateDatalist(countries) {
  const datalist = document.getElementById('countries-datalist');
  datalist.innerHTML = '';
  countries.forEach((c) => {
    const opt = document.createElement('option');
    if (currentLang === 'tr') {
      opt.value = c.name_tr;
      opt.label = `${c.name} (${c.continent})`;
    } else {
      opt.value = c.name;
      opt.label = `${c.name_tr} (${c.continent})`;
    }
    datalist.appendChild(opt);
  });
}

// --- CLICK ON GLOBE TO WALK THERE ---
function setupClickToWalk() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let mouseDownPos = { x: 0, y: 0 };
  window.addEventListener('pointerdown', (e) => {
    mouseDownPos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointerup', (e) => {
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
    if (dist > 5) return;

    if (e.target.closest('.glass-panel') || e.target.closest('.modal-overlay')) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthMesh);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const targetCoords = vector3ToLatLon(hitPoint, GLOBE_RADIUS);

      waypoints = countryService.getGreatCirclePath(
        character.lat,
        character.lon,
        targetCoords.lat,
        targetCoords.lon,
        90
      );
      currentDirection = null;
      isAutoWalking = true;
      document.getElementById('btn-toggle-walk').textContent =
        currentLang === 'tr' ? I18N.tr.btnPause : I18N.en.btnPause;

      const targetCountry = countryService.findCountry(targetCoords.lat, targetCoords.lon);
      if (targetCountry) {
        const displayName = currentLang === 'tr' ? (targetCountry.name_tr || targetCountry.name) : (targetCountry.name || targetCountry.name_tr);
        updateSpeechBubble(
          currentLang === 'tr'
            ? `📍 Kürede işaretlediğin noktaya doğru yürüyorum: <strong>${displayName}</strong>!`
            : `📍 Walking towards the point marked on the globe: <strong>${displayName}</strong>!`
        );
      } else {
        updateSpeechBubble(
          currentLang === 'tr'
            ? `📍 Kürede işaretlediğin koordinata doğru yürüyorum.`
            : `📍 Walking towards the marked coordinates.`
        );
      }
    }
  });
}

// --- KEYBOARD CONTROLS (WASD / ARROW KEYS) ---
function setupKeyboardControls() {
  const keys = {};

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    keys[e.key.toLowerCase()] = true;

    if (['w', 'arrowup', 's', 'arrowdown', 'a', 'arrowleft', 'd', 'arrowright'].includes(e.key.toLowerCase())) {
      isAutoWalking = true;
      waypoints = [];
      document.getElementById('btn-toggle-walk').textContent =
        currentLang === 'tr' ? I18N.tr.btnPause : I18N.en.btnPause;

      if (keys['w'] || keys['arrowup']) {
        if (keys['d'] || keys['arrowright']) currentDirection = 'NE';
        else if (keys['a'] || keys['arrowleft']) currentDirection = 'NW';
        else currentDirection = 'N';
      } else if (keys['s'] || keys['arrowdown']) {
        if (keys['d'] || keys['arrowright']) currentDirection = 'SE';
        else if (keys['a'] || keys['arrowleft']) currentDirection = 'SW';
        else currentDirection = 'S';
      } else if (keys['d'] || keys['arrowright']) {
        currentDirection = 'E';
      } else if (keys['a'] || keys['arrowleft']) {
        currentDirection = 'W';
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT') return;
    delete keys[e.key.toLowerCase()];
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start application
init();
