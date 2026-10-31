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
const visitedCountries = new Map(); // id -> { name, name_tr, capital, date }

// Direction angle mapping (0 = North, 90 = East, 180 = South, 270 = West)
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

const DIR_NAMES_TR = {
  'N': 'Kuzey',
  'NE': 'Kuzeydoğu',
  'E': 'Doğu',
  'SE': 'Güneydoğu',
  'S': 'Güney',
  'SW': 'Güneybatı',
  'W': 'Batı',
  'NW': 'Kuzeybatı'
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

  // Setup UI Listeners
  setupUI();
  setupClickToWalk();
  setupKeyboardControls();

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

  // Directional Sun Light
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(80, 50, 100);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 250;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Subtle fill light for dark side of Earth
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

  // Load Specular Map to make oceans shine
  textureLoader.load('/textures/earth_specular_2048.jpg', (specMap) => {
    earthMat.roughnessMap = specMap;
    earthMat.needsUpdate = true;
  });

  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.receiveShadow = true;
  scene.add(earthMesh);

  // 2. Realistic Floating Clouds
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

  // 3. Atmospheric Halo Glow (Inverted Fresnel Shader)
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
  const baseSpeed = 12.0 * walkSpeedMultiplier; // degrees per second / step

  // MODE A: Following Great-Circle Waypoints to a Destination
  if (waypoints.length > 0) {
    const nextWp = waypoints[0];

    // Calculate angular distance
    const vCurr = latLonToVector3(character.lat, character.lon, 1);
    const vNext = latLonToVector3(nextWp.lat, nextWp.lon, 1);
    const angle = vCurr.angleTo(vNext); // radians

    const stepAngle = (baseSpeed * Math.PI / 180) * delta;

    if (angle <= stepAngle || angle < 0.005) {
      // Reached this waypoint
      character.lat = nextWp.lat;
      character.lon = nextWp.lon;
      waypoints.shift();

      if (waypoints.length === 0) {
        // Arrived at destination country!
        onArrivalAtDestination();
      }
    } else {
      // Slerp towards next waypoint
      const t = stepAngle / angle;
      const vInterp = vCurr.clone().lerp(vNext, t).normalize();
      const newCoords = vector3ToLatLon(vInterp, 1);

      // Compute heading angle
      const dLat = nextWp.lat - character.lat;
      const dLon = nextWp.lon - character.lon;
      let targetHeading = Math.atan2(dLon, dLat) * (180 / Math.PI);
      if (targetHeading < 0) targetHeading += 360;

      // Smooth heading turn
      character.heading = targetHeading;
      character.lat = newCoords.lat;
      character.lon = newCoords.lon;
    }
  }
  // MODE B: Continuous Directional Walk (Compass N, S, E, W etc.)
  else if (currentDirection && isAutoWalking) {
    const heading = DIR_HEADINGS[currentDirection];
    character.heading = heading;

    const rad = heading * (Math.PI / 180);
    const stepDeg = baseSpeed * delta;

    // dLat and dLon
    const dLat = Math.cos(rad) * stepDeg;
    const cosLat = Math.max(0.1, Math.cos(character.lat * Math.PI / 180));
    const dLon = (Math.sin(rad) * stepDeg) / cosLat;

    character.lat = Math.max(-85, Math.min(85, character.lat + dLat));
    character.lon += dLon;

    // Wrap longitude
    while (character.lon < -180) character.lon += 360;
    while (character.lon > 180) character.lon -= 360;
  }

  // Update 3D position and orientation
  character.updatePosition();

  // Detect Country at current position
  checkCountryAtFeet();
}

// --- COUNTRY DETECTION ---
let lastAnnouncedCountryId = null;

function checkCountryAtFeet() {
  const country = countryService.findCountry(character.lat, character.lon);
  const currentId = country ? country.id : 'ocean';

  // Update Character's T-shirt immediately
  character.setCountry(country);
  updateLocationHUD(country);

  // If entered a new country/territory
  if (currentId !== lastAnnouncedCountryId) {
    lastAnnouncedCountryId = currentId;

    if (country) {
      recordVisit(country);
      showCountryToast(country);

      // If user enabled "Ask on border" during continuous exploration
      if (askOnBorder && isAutoWalking && waypoints.length === 0) {
        pauseWalk();
        promptUserForNextDirection(country);
      }
    } else {
      // In Open Ocean
      updateSpeechBubble(
        '🌊 Açık Deniz / Uluslararası Sulara adım attım! T-shirt\'üm dalgalı okyanus tasarımı oldu. Şimdi hangi yöne yelken açalım?'
      );
    }
  }
}

function promptUserForNextDirection(country) {
  const flagEmoji = getFlagEmoji(country.id);
  const name = country.name_tr || country.name;
  updateSpeechBubble(
    `Vay canına! <strong>${name}</strong> topraklarına ayak bastım! ${flagEmoji} T-shirt'üm hemen <strong>${name}</strong> bayrağına dönüştü! Şimdi hangi yöne devam etmemi istersin?`
  );
}

function onArrivalAtDestination() {
  isAutoWalking = false;
  character.celebrate();

  const country = countryService.findCountry(character.lat, character.lon);
  if (country) {
    const flag = getFlagEmoji(country.id);
    const name = country.name_tr || country.name;
    updateSpeechBubble(
      `🎉 Harika! Hedefimize vardık: <strong>${name}</strong> ${flag}! T-shirt'üm gururla dalgalanıyor. Sıradaki durağımız neresi olsun?`
    );
  } else {
    updateSpeechBubble(`🎉 Hedef koordinata ulaştık! Şimdi nereye gitmek istersin?`);
  }

  document.getElementById('btn-toggle-walk').textContent = '▶️ Devam Et';
}

// --- RECORD VISIT / PASSPORT ---
function recordVisit(country) {
  if (!visitedCountries.has(country.id)) {
    visitedCountries.set(country.id, {
      ...country,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Update Counter
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
    stamp.innerHTML = `
      <img class="stamp-flag" src="https://flagcdn.com/w160/${c.id}.png" alt="${c.name_tr}" onerror="this.style.display='none'">
      <span class="stamp-name">${c.name_tr}</span>
      <span class="stamp-date">🕒 ${c.date}</span>
    `;
    grid.appendChild(stamp);
  });
}

// --- CAMERA FOLLOW & VIEW MODES ---
function updateCamera() {
  if (cameraMode === 'orbit') {
    // Free OrbitControls
    return;
  }

  const charPos = character.group.position;
  const normal = charPos.clone().normalize();

  if (cameraMode === 'follow') {
    // Third-person camera behind character
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.group.quaternion);
    const camOffset = normal.clone().multiplyScalar(4.0).sub(forward.clone().multiplyScalar(7.5));
    const targetCamPos = charPos.clone().add(camOffset);

    camera.position.lerp(targetCamPos, 0.08);
    controls.target.lerp(charPos.clone().add(normal.clone().multiplyScalar(1.2)), 0.08);
  } else if (cameraMode === 'focus') {
    // Zoom close into character's chest / T-Shirt
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(character.group.quaternion);
    const camOffset = forward.clone().multiplyScalar(2.4).add(normal.clone().multiplyScalar(0.9));
    const targetCamPos = charPos.clone().add(camOffset);

    camera.position.lerp(targetCamPos, 0.1);
    controls.target.lerp(charPos.clone().add(normal.clone().multiplyScalar(0.9)), 0.1);
  }
}

// --- UI UPDATES ---
function updateLocationHUD(country) {
  const flagContainer = document.getElementById('flag-container');
  const nameEl = document.getElementById('country-name');
  const infoEl = document.getElementById('country-info');
  const latEl = document.getElementById('coord-lat');
  const lonEl = document.getElementById('coord-lon');

  // Coordinates
  const latStr = `${Math.abs(character.lat).toFixed(2)}° ${character.lat >= 0 ? 'K (N)' : 'G (S)'}`;
  const lonStr = `${Math.abs(character.lon).toFixed(2)}° ${character.lon >= 0 ? 'D (E)' : 'B (W)'}`;
  latEl.textContent = latStr;
  lonEl.textContent = lonStr;

  if (country) {
    flagContainer.innerHTML = `
      <img id="country-flag" class="country-flag-img" src="https://flagcdn.com/w320/${country.id}.png" alt="${country.name_tr}">
    `;
    nameEl.textContent = country.name_tr || country.name;
    infoEl.textContent = `${country.capital || 'Bilinmiyor'} • ${country.continent || 'Dünya'}`;
  } else {
    flagContainer.innerHTML = `
      <div class="ocean-flag-icon">🌊</div>
    `;
    nameEl.textContent = 'Açık Deniz';
    infoEl.textContent = 'Uluslararası Okyanus Suları';
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

  const flagEmoji = getFlagEmoji(country.id);
  flagEl.textContent = flagEmoji;
  titleEl.textContent = `${country.name_tr || country.name} Toprakları!`;
  descEl.textContent = `T-shirt bayrak deseni güncellendi`;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Convert ISO2 to Emoji Flag
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode === 'ocean') return '🌊';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// --- USER INTERFACE ACTIONS ---
function setupUI() {
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

  // Destination Search / Quick Chips
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
      const countryName = btn.getAttribute('data-country');
      navigateToCountryByName(countryName);
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
  document.getElementById('btn-toggle-walk').textContent = '⏸️ Durdur';

  const dirName = DIR_NAMES_TR[dir] || dir;
  updateSpeechBubble(
    `🧭 <strong>${dirName}</strong> yönüne doğru yürüyüşe başladım! Yol boyunca geçtiğim tüm ülkelerin bayrakları t-shirt'üme yansıyacak.`
  );
}

function pauseWalk() {
  isAutoWalking = false;
  document.getElementById('btn-toggle-walk').textContent = '▶️ Devam Et';
}

function resumeWalk() {
  if (!currentDirection && waypoints.length === 0) {
    currentDirection = 'E'; // Default to East
  }
  isAutoWalking = true;
  document.getElementById('btn-toggle-walk').textContent = '⏸️ Durdur';
}

function navigateToCountryByName(nameQuery) {
  const q = nameQuery.toLowerCase().trim();
  const found = countryService.countries.find(
    (c) =>
      c.name_tr.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      c.id.toLowerCase() === q ||
      c.name_tr.toLowerCase().includes(q)
  );

  if (!found) {
    updateSpeechBubble(`⚠️ "${nameQuery}" adında bir ülke bulunamadı. Lütfen listeden veya arama önerilerinden seçin.`);
    return;
  }

  // Calculate destination coordinates from country bbox center
  const targetLon = (found.bbox[0] + found.bbox[2]) / 2;
  const targetLat = (found.bbox[1] + found.bbox[3]) / 2;

  // Generate Great Circle waypoints
  waypoints = countryService.getGreatCirclePath(character.lat, character.lon, targetLat, targetLon, 120);
  currentDirection = null;
  isAutoWalking = true;
  document.getElementById('btn-toggle-walk').textContent = '⏸️ Durdur';

  const flagEmoji = getFlagEmoji(found.id);
  updateSpeechBubble(
    `🚀 Rota oluşturuldu! <strong>${found.name_tr}</strong> ${flagEmoji} yönüne doğru kıtaları aşarak yürüyorum. Yol üzerindeki tüm ülkelerin bayrakları anlık olarak T-shirt'üme yansıyacak!`
  );
}

function chooseRandomCountry() {
  if (!countryService.countries.length) return;
  const randIndex = Math.floor(Math.random() * countryService.countries.length);
  const randCountry = countryService.countries[randIndex];
  navigateToCountryByName(randCountry.name_tr);
}

function populateDatalist(countries) {
  const datalist = document.getElementById('countries-datalist');
  datalist.innerHTML = '';
  countries.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.name_tr;
    opt.label = `${c.name} (${c.continent})`;
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
    // Only trigger if user did not drag/orbit the camera
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
    if (dist > 5) return;

    // Check if clicked on UI panel
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
      document.getElementById('btn-toggle-walk').textContent = '⏸️ Durdur';

      const targetCountry = countryService.findCountry(targetCoords.lat, targetCoords.lon);
      if (targetCountry) {
        updateSpeechBubble(
          `📍 Kürede işaretlediğin noktaya doğru yürüyorum: <strong>${targetCountry.name_tr}</strong>!`
        );
      } else {
        updateSpeechBubble(`📍 Kürede işaretlediğin koordinata doğru yürüyorum.`);
      }
    }
  });
}

// --- KEYBOARD CONTROLS (WASD / ARROW KEYS) ---
function setupKeyboardControls() {
  const keys = {};

  window.addEventListener('keydown', (e) => {
    // Ignore if typing in text input
    if (e.target.tagName === 'INPUT') return;

    keys[e.key.toLowerCase()] = true;

    if (['w', 'arrowup', 's', 'arrowdown', 'a', 'arrowleft', 'd', 'arrowright'].includes(e.key.toLowerCase())) {
      isAutoWalking = true;
      waypoints = [];
      document.getElementById('btn-toggle-walk').textContent = '⏸️ Durdur';

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

    // If no directional keys held, pause
    const anyHeld = ['w', 'arrowup', 's', 'arrowdown', 'a', 'arrowleft', 'd', 'arrowright'].some(
      (k) => keys[k]
    );
    if (!anyHeld && waypoints.length === 0) {
      // Keep direction or continue if auto-walking
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start application
init();

