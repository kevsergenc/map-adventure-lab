# 🌍 Dünya Gezgini & Bayrak T-Shirt (3D Interactive World Globe)

Bu proje, 3D etkileşimli bir Dünya küresi üzerinde hareket eden bir insan figürünün (gezgin), ayak bastığı her ülkenin bayrağını anlık olarak t-shirt'üne yansıttığı ve gideceği yönü kullanıcıya sorarak etkileşimli seyahat ettiği modern bir Three.js WebGL uygulamasıdır.

---

## ✨ Özellikler

1. **3D Gerçekçi Dünya Küresi & Uzay**:
   - Yüksek çözünürlüklü NASA Blue Marble yeryüzü dokusu ve okyanus yansımalarını sağlayan Specular Harita.
   - Gerçekçi dönen bulut katmanı (`earth_clouds`).
   - Yörüngeden görünen mavi atmosfer halesi (özel ters Fresnel GLSL shader).
   - 3.500+ yıldızdan oluşan derin uzay parçacık alanı.
   - Küre üzerinde parlayan 3D ülke sınır çizgileri (`LineSegments`).

2. **3D Gezgin İnsan Figürü & Dinamik T-Shirt**:
   - Dünya küresinin yüzeyine dikey olarak konumlanan (normal vektör hizalamalı), yönüne göre dönen 3D insan modeli.
   - Kol ve bacak sallanması, gövde sekmesi ile adım seslerini içeren dinamik yürüme animasyonu.
   - **Dinamik Bayrak T-Shirt'ü**:
     - Ayak basılan her bağımsız ülkenin bayrağı, yüksek çözünürlüklü olarak t-shirt'ün göğsüne ve kumaş dokusuna işlenir.
     - Açık deniz ve uluslararası sulara çıkıldığında t-shirt otomatik olarak denizci/dalga temasına bürünür.
     - HUD panelinde t-shirt'ün anlık büyütülmüş canlı önizlemesi yer alır.

3. **Etkileşimli Yön Sorma & Seyahat Rehberi (Yapay Zeka Gezgin)**:
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

