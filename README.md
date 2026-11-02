# Turkish

# 🌍 3D Interactive World Globe & Adventure Lab

Bu proje, 3D etkileşimli bir Dünya küresi üzerinde hareket eden bir insan figürünün (gezgin), ayak bastığı her ülkenin bayrağını anlık olarak t-shirt'üne yansıttığı ve gideceği yönü kullanıcıya sorarak etkileşimli seyahat ettiği modern bir Three.js WebGL uygulamasıdır. 
Bu proje, geleneksel manuel kodlama yapılmadan, yalnızca istemler (prompt engineering) kullanılarak **AntiGravity IDE** aracılığıyla sıfırdan geliştirilmiştir.
---
## ✨ Özellikler

1. **3D Gerçekçi Dünya Küresi & Uzay**:
   - Yüksek çözünürlüklü NASA Blue Marble yeryüzü dokusu ve okyanus yansımalarını sağlayan Specular Harita.
   - Gerçekçi dönen bulut katmanı (`earth_clouds`).
   - Yörüngeden görünen mavi atmosfer halesi (özel ters Fresnel GLSL shader).
   - 3.500+ yıldızdan oluşan derin uzay parçacık alanı.
   - Küre üzerinde parlayan 3D ülke sınır çizgileri (`LineSegments`).

2. **3D Gezgin İnsan Figürü**:
   - Dünya küresinin yüzeyine dikey olarak konumlanan (normal vektör hizalamalı), yönüne göre dönen 3D insan modeli.
   - Kol ve bacak sallanması, gövde sekmesi ile adım seslerini içeren dinamik yürüme animasyonu.
   - **Dinamik Bayrak T-Shirt'ü**:
     - Ayak basılan her bağımsız ülkenin bayrağı, yüksek çözünürlüklü olarak t-shirt'ün göğsüne ve kumaş dokusuna işlenir.
     - Açık deniz ve uluslararası sulara çıkıldığında t-shirt otomatik olarak denizci/dalga temasına bürünür.
     - HUD panelinde t-shirt'ün anlık büyütülmüş canlı önizlemesi yer alır.

3. **Etkileşimli Yön Sorma & Seyahat Rehberi**:
   - Gezgin kullanıcıyla konuşur: *"Merhaba! Şu an Türkiye topraklarındayım. 🇹🇷 T-shirt'üm Türkiye bayrağı oldu! Şimdi nereye gitmemi istersin?"*
   - **8 Yönlü Pusula**: Kuzey, Kuzeydoğu, Doğu, Güneydoğu, Güney, Güneybatı, Batı, Kuzeybatı.
   - **Hedef Ülke Arama & Hızlı Rotalar**: (Japonya, Brezilya, Fransa, Mısır, ABD, Avustralya vb.). Büyük daire rotası (Great Circle Geodesic) boyunca kıtaları aşarak yürür; geçtiği her ülkenin sınırında t-shirt anlık güncellenir!
   - **Yeni Sınırda Sorma Özelliği**: Karakter yeni bir ülkeye girdiğinde durup kullanıcıya bir sonraki yönü sorabilir.
   - **🎲 Rastgele Macera**: Tek tıkla dünyanın herhangi bir ülkesine sürpriz rota çizer.
   - **Küreye Tıklayarak Yürütme**: Dünya üzerinde herhangi bir noktaya fare ile tıklandığında gezgin oraya doğru yürür.
   - **Klavye Desteği**: [W], [A], [S], [D] veya Yön tuşları ile serbest yönlendirme.

4. **Kamera Modları**:
   - 🎥 **Gezgin Takip (Follow Cam)**: Karakterin arkasından 3. şahıs takip kamerası.
   - 🌐 **Serbest Küre (Orbit Cam)**: Küreyi fareyle serbestçe döndürme ve yakınlaştırma.
   - 👕 **T-Shirt Odak (Focus Cam)**: T-shirt'teki bayrak detayını ve yüz ifadelerini yakından inceleyen sinematik kamera.

5. **Gezgin Pasaportu & Damgalar**:
   - Gezilen tüm ülkeler tarih ve saat damgasıyla pasaport koleksiyonuna kaydedilir.

6. **Web Audio Ses Efektleri**:
   - Dış dosya gerektirmeyen sentetik adım sesleri, yeni ülke keşif melodisi ve açık deniz esintisi. 
   **Sesli Ülke Anonsu**: Gezgin bir ülkenin üzerine geldiğinde veya yeni bir ülkeye ayak bastığında, o ülkenin ismini kullanıcıya **sesli olarak** söyler.

---
**Geliştirme Yöntemi:** Bu uygulama, AntiGravity IDE kullanılarak yapay zeka ile uçtan uca etkileşimli komutlar (prompt'lar) verilerek tasarlanmıştır.
---

## Kullanılan Teknolojiler


- **Frontend & Core:** HTML5, CSS3, JavaScript (ES6+), Modern Web APIs
- **3D Grafik & Görselleştirme:** Three.js, WebGL, GLSL Shaders
- **Ses & Konuşma:** Web Audio API, Web Speech API 
- **Veri İşleme & Otomasyon:** Python 
- **Paket Yönetimi & Build Aracı:** npm, Vite (`package.json`)
- **Geliştirme Ortamı:** AntiGravity IDE 
---

## 🚀 Çalıştırma

Geliştirme sunucusu varsayılan olarak `http://127.0.0.1:5173` adresinde çalışmaktadır.

Dilediğiniz zaman terminalden çalıştırmak için:
```bash
npm run dev
```

Projeyi derlemek için:
```bash
npm run build
```
Derlenen dosyalar `dist/` klasörüne oluşturulur.

# English

# 🌍 3D Interactive World Globe & Adventure Lab

This project is a modern Three.js WebGL application featuring a human character (traveler) moving across an interactive 3D Earth globe. The traveler's T-shirt instantly reflects the flag of the country they step on, and they interactively travel by asking the user for their next destination.
This project was developed entirely from scratch using **AntiGravity IDE** through interactive prompts (prompt engineering), without traditional manual coding.
---
## ✨ Features

1. **3D Realistic World Globe & Space**:
   - High-resolution NASA Blue Marble surface texture and Specular Map for ocean reflections.
   - Realistic rotating cloud layer (`earth_clouds`).
   - Blue atmosphere halo visible from orbit (custom inverse Fresnel GLSL shader).
   - Deep space particle field consisting of 3,500+ stars.
   - Glowing 3D country border lines (`LineSegments`) across the globe.

2. **3D Traveler Human Figure**:
   - 3D human model positioned perpendicularly to the Earth's surface (normal vector alignment) and rotating according to its direction.
   - Dynamic walking animation featuring arm and leg swinging, body bobbing, and footstep sounds.
   - **Dynamic Flag T-Shirt**:
     - The flag of every independent country stepped on is rendered in high resolution onto the chest and fabric texture of the T-shirt.
     - Automatically switches to a sailor/wave theme when entering open seas and international waters.
     - Live magnified preview of the T-shirt featured in the HUD panel.

3. **Interactive Direction Prompting & Travel Guide**:
   - The traveler speaks to the user: *"Hello! I am currently in Turkey. 🇹🇷 My T-shirt has turned into the Turkish flag! Where would you like me to go next?"*
   - **8-Way Compass**: North, Northeast, East, Southeast, South, Southwest, West, Northwest.
   - **Target Country Search & Quick Routes**: (Japan, Brazil, France, Egypt, USA, Australia, etc.). Walks across continents along a Great Circle Geodesic route; the T-shirt updates instantly at the border of every crossed country!
   - **Ask at New Border Feature**: The traveler can stop and ask the user for the next direction upon entering a new country.
   - **🎲 Random Adventure**: Draws a surprise route to any country in the world with a single click.
   - **Click-to-Walk on Globe**: Clicking anywhere on the Earth with the mouse makes the traveler walk towards that point.
   - **Keyboard Support**: Free navigation using [W], [A], [S], [D] or Arrow keys.

4. **Camera Modes**:
   - 🎥 **Follow Cam**: 3rd-person tracking camera from behind the character.
   - 🌐 **Orbit Cam**: Free rotation and zooming of the globe with the mouse.
   - 👕 **T-Shirt Focus Cam**: Cinematic camera for inspecting flag details and facial expressions closely.

5. **Traveler Passport & Stamps**:
   - All visited countries are logged into the passport collection with date and time stamps.

6. **Web Audio Sound Effects**:
   - Synthesized footstep sounds requiring no external files, new country discovery melody, and open sea breeze. 
   - **Spoken Country Announcement**: When the traveler approaches or steps into a new country, they **speak out** the country's name to the user.

---
**Development Methodology:** This application was designed end-to-end with artificial intelligence using interactive prompts via AntiGravity IDE.
---

## Technologies Used

- **Frontend & Core:** HTML5, CSS3, JavaScript (ES6+), Modern Web APIs
- **3D Graphics & Visualization:** Three.js, WebGL, GLSL Shaders
- **Audio & Speech:** Web Audio API, Web Speech API 
- **Data Processing & Automation:** Python 
- **Package Management & Build Tool:** npm, Vite (`package.json`)
- **Development Environment:** AntiGravity IDE 
---

## 🚀 Running

The development server runs by default at `http://127.0.0.1:5173`.

To run it from the terminal at any time:
```bash
npm run dev