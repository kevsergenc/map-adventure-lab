import json
import os

with open('countries_test.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

tr_names = {
    "Afghanistan": ("Afganistan", "Kâbil", "Asya"),
    "Albania": ("Arnavutluk", "Tiran", "Avrupa"),
    "Algeria": ("Cezayir", "Cezayir", "Afrika"),
    "Angola": ("Angola", "Luanda", "Afrika"),
    "Antarctica": ("Antarktika", "Yok", "Antarktika"),
    "Argentina": ("Arjantin", "Buenos Aires", "Güney Amerika"),
    "Armenia": ("Ermenistan", "Erivan", "Asya"),
    "Australia": ("Avustralya", "Canberra", "Okyanusya"),
    "Austria": ("Avusturya", "Viyana", "Avrupa"),
    "Azerbaijan": ("Azerbaycan", "Bakü", "Asya"),
    "Bahamas": ("Bahamalar", "Nassau", "Kuzey Amerika"),
    "Bangladesh": ("Bangladeş", "Dakka", "Asya"),
    "Belarus": ("Belarus", "Minsk", "Avrupa"),
    "Belgium": ("Belçika", "Brüksel", "Avrupa"),
    "Belize": ("Belize", "Belmopan", "Kuzey Amerika"),
    "Benin": ("Benin", "Porto-Novo", "Afrika"),
    "Bhutan": ("Butan", "Thimphu", "Asya"),
    "Bolivia": ("Bolivya", "Sucre / La Paz", "Güney Amerika"),
    "Bosnia and Herz.": ("Bosna-Hersek", "Saraybosna", "Avrupa"),
    "Botswana": ("Botsvana", "Gaborone", "Afrika"),
    "Brazil": ("Brezilya", "Brasília", "Güney Amerika"),
    "Brunei": ("Bruney", "Bandar Seri Begawan", "Asya"),
    "Bulgaria": ("Bulgaristan", "Sofya", "Avrupa"),
    "Burkina Faso": ("Burkina Faso", "Vagadugu", "Afrika"),
    "Burundi": ("Burundi", "Gitega", "Afrika"),
    "Cambodia": ("Kamboçya", "Phnom Penh", "Asya"),
    "Cameroon": ("Kamerun", "Yaoundé", "Afrika"),
    "Canada": ("Kanada", "Ottawa", "Kuzey Amerika"),
    "Central African Rep.": ("Orta Afrika Cumhuriyeti", "Bangui", "Afrika"),
    "Chad": ("Çad", "N'Djamena", "Afrika"),
    "Chile": ("Şili", "Santiago", "Güney Amerika"),
    "China": ("Çin", "Pekin", "Asya"),
    "Colombia": ("Kolombiya", "Bogota", "Güney Amerika"),
    "Congo": ("Kongo Cumhuriyeti", "Brazzaville", "Afrika"),
    "Costa Rica": ("Kosta Rika", "San José", "Kuzey Amerika"),
    "Croatia": ("Hırvatistan", "Zagreb", "Avrupa"),
    "Cuba": ("Küba", "Havana", "Kuzey Amerika"),
    "Cyprus": ("Kıbrıs", "Lefkoşa", "Avrupa"),
    "Czechia": ("Çekya", "Prag", "Avrupa"),
    "Côte d'Ivoire": ("Fildişi Sahili", "Yamoussoukro", "Afrika"),
    "Dem. Rep. Congo": ("Demokratik Kongo Cumhuriyeti", "Kinşasa", "Afrika"),
    "Denmark": ("Danimarka", "Kopenhag", "Avrupa"),
    "Djibouti": ("Cibuti", "Cibuti", "Afrika"),
    "Dominican Rep.": ("Dominik Cumhuriyeti", "Santo Domingo", "Kuzey Amerika"),
    "Ecuador": ("Ekvador", "Quito", "Güney Amerika"),
    "Egypt": ("Mısır", "Kahire", "Afrika"),
    "El Salvador": ("El Salvador", "San Salvador", "Kuzey Amerika"),
    "Eq. Guinea": ("Ekvator Ginesi", "Malabo", "Afrika"),
    "Eritrea": ("Eritre", "Asmara", "Afrika"),
    "Estonia": ("Estonya", "Tallinn", "Avrupa"),
    "eSwatini": ("Esvatini", "Mbabane", "Afrika"),
    "Swaziland": ("Esvatini", "Mbabane", "Afrika"),
    "Ethiopia": ("Etiyopya", "Addis Ababa", "Afrika"),
    "Falkland Is.": ("Falkland Adaları", "Stanley", "Güney Amerika"),
    "Fiji": ("Fiji", "Suva", "Okyanusya"),
    "Finland": ("Finlandiya", "Helsinki", "Avrupa"),
    "Fr. S. Antarctic Lands": ("Fransız Güney Toprakları", "Port-aux-Français", "Antarktika"),
    "France": ("Fransa", "Paris", "Avrupa"),
    "Gabon": ("Gabon", "Libreville", "Afrika"),
    "Gambia": ("Gambiya", "Banjul", "Afrika"),
    "Georgia": ("Gürcistan", "Tiflis", "Asya"),
    "Germany": ("Almanya", "Berlin", "Avrupa"),
    "Ghana": ("Gana", "Akra", "Afrika"),
    "Greece": ("Yunanistan", "Atina", "Avrupa"),
    "Greenland": ("Grönland", "Nuuk", "Kuzey Amerika"),
    "Guatemala": ("Guatemala", "Guatemala", "Kuzey Amerika"),
    "Guinea": ("Gine", "Konakri", "Afrika"),
    "Guinea-Bissau": ("Gine-Bissau", "Bissau", "Afrika"),
    "Guyana": ("Guyana", "Georgetown", "Güney Amerika"),
    "Haiti": ("Haiti", "Port-au-Prince", "Kuzey Amerika"),
    "Honduras": ("Honduras", "Tegucigalpa", "Kuzey Amerika"),
    "Hungary": ("Macaristan", "Budapeşte", "Avrupa"),
    "Iceland": ("İzlanda", "Reykjavik", "Avrupa"),
    "India": ("Hindistan", "Yeni Delhi", "Asya"),
    "Indonesia": ("Endonezya", "Cakarta", "Asya"),
    "Iran": ("İran", "Tahran", "Asya"),
    "Iraq": ("Irak", "Bağdat", "Asya"),
    "Ireland": ("İrlanda", "Dublin", "Avrupa"),
    "Israel": ("İsrail", "Kudüs / Tel Aviv", "Asya"),
    "Italy": ("İtalya", "Roma", "Avrupa"),
    "Jamaica": ("Jamaika", "Kingston", "Kuzey Amerika"),
    "Japan": ("Japonya", "Tokyo", "Asya"),
    "Jordan": ("Ürdün", "Amman", "Asya"),
    "Kazakhstan": ("Kazakistan", "Astana", "Asya"),
    "Kenya": ("Kenya", "Nairobi", "Afrika"),
    "Kosovo": ("Kosova", "Priştine", "Avrupa"),
    "Kuwait": ("Kuveyt", "Kuveyt", "Asya"),
    "Kyrgyzstan": ("Kırgızistan", "Bişkek", "Asya"),
    "Laos": ("Laos", "Vientiane", "Asya"),
    "Latvia": ("Letonya", "Riga", "Avrupa"),
    "Lebanon": ("Lübnan", "Beyrut", "Asya"),
    "Lesotho": ("Lesotho", "Maseru", "Afrika"),
    "Liberia": ("Liberya", "Monrovia", "Afrika"),
    "Libya": ("Libya", "Trablus", "Afrika"),
    "Lithuania": ("Litvanya", "Vilnius", "Avrupa"),
    "Luxembourg": ("Lüksemburg", "Lüksemburg", "Avrupa"),
    "Madagascar": ("Madagaskar", "Antananarivo", "Afrika"),
    "Malawi": ("Malavi", "Lilongwe", "Afrika"),
    "Malaysia": ("Malezya", "Kuala Lumpur", "Asya"),
    "Mali": ("Mali", "Bamako", "Afrika"),
    "Mauritania": ("Moritanya", "Nouakchott", "Afrika"),
    "Mexico": ("Meksika", "Mexico City", "Kuzey Amerika"),
    "Moldova": ("Moldova", "Kişinev", "Avrupa"),
    "Mongolia": ("Moğolistan", "Ulan Batur", "Asya"),
    "Montenegro": ("Karadağ", "Podgorica", "Avrupa"),
    "Morocco": ("Fas", "Rabat", "Afrika"),
    "Mozambique": ("Mozambik", "Maputo", "Afrika"),
    "Myanmar": ("Myanmar", "Naypyidaw", "Asya"),
    "N. Cyprus": ("Kuzey Kıbrıs", "Lefkoşa", "Avrupa"),
    "Namibia": ("Namibya", "Windhoek", "Afrika"),
    "Nepal": ("Nepal", "Katmandu", "Asya"),
    "Netherlands": ("Hollanda", "Amsterdam", "Avrupa"),
    "New Caledonia": ("Yeni Kaledonya", "Nouméa", "Okyanusya"),
    "New Zealand": ("Yeni Zelanda", "Wellington", "Okyanusya"),
    "Nicaragua": ("Nikaragua", "Managua", "Kuzey Amerika"),
    "Niger": ("Nijer", "Niamey", "Afrika"),
    "Nigeria": ("Nijerya", "Abuja", "Afrika"),
    "North Korea": ("Kuzey Kore", "Pyongyang", "Asya"),
    "North Macedonia": ("Kuzey Makedonya", "Üsküp", "Avrupa"),
    "Macedonia": ("Kuzey Makedonya", "Üsküp", "Avrupa"),
    "Norway": ("Norveç", "Oslo", "Avrupa"),
    "Oman": ("Umman", "Maskat", "Asya"),
    "Pakistan": ("Pakistan", "İslamabad", "Asya"),
    "Palestine": ("Filistin", "Doğu Kudüs / Ramallah", "Asya"),
    "Panama": ("Panama", "Panama City", "Kuzey Amerika"),
    "Papua New Guinea": ("Papua Yeni Gine", "Port Moresby", "Okyanusya"),
    "Paraguay": ("Paraguay", "Asunción", "Güney Amerika"),
    "Peru": ("Peru", "Lima", "Güney Amerika"),
    "Philippines": ("Filipinler", "Manila", "Asya"),
    "Poland": ("Polonya", "Varşova", "Avrupa"),
    "Portugal": ("Portekiz", "Lizbon", "Avrupa"),
    "Puerto Rico": ("Porto Riko", "San Juan", "Kuzey Amerika"),
    "Qatar": ("Katar", "Doha", "Asya"),
    "Romania": ("Romanya", "Bükreş", "Avrupa"),
    "Russia": ("Rusya", "Moskova", "Avrupa/Asya"),
    "Rwanda": ("Ruanda", "Kigali", "Afrika"),
    "S. Sudan": ("Güney Sudan", "Cuba", "Afrika"),
    "Saudi Arabia": ("Suudi Arabistan", "Riyad", "Asya"),
    "Senegal": ("Senegal", "Dakar", "Afrika"),
    "Serbia": ("Sırbistan", "Belgrad", "Avrupa"),
    "Sierra Leone": ("Sierra Leone", "Freetown", "Afrika"),
    "Slovakia": ("Slovakya", "Bratislava", "Avrupa"),
    "Slovenia": ("Slovenya", "Ljubljana", "Avrupa"),
    "Solomon Is.": ("Solomon Adaları", "Honiara", "Okyanusya"),
    "Somalia": ("Somali", "Mogadişu", "Afrika"),
    "Somaliland": ("Somaliland", "Hargeisa", "Afrika"),
    "South Africa": ("Güney Afrika", "Pretoria", "Afrika"),
    "South Korea": ("Güney Kore", "Seul", "Asya"),
    "Spain": ("İspanya", "Madrid", "Avrupa"),
    "Sri Lanka": ("Sri Lanka", "Sri Jayawardenepura Kotte", "Asya"),
    "Sudan": ("Sudan", "Hartum", "Afrika"),
    "Suriname": ("Surinam", "Paramaribo", "Güney Amerika"),
    "Sweden": ("İsveç", "Stockholm", "Avrupa"),
    "Switzerland": ("İsviçre", "Bern", "Avrupa"),
    "Syria": ("Suriye", "Şam", "Asya"),
    "Taiwan": ("Tayvan", "Taipei", "Asya"),
    "Tajikistan": ("Tacikistan", "Duşanbe", "Asya"),
    "Tanzania": ("Tanzanya", "Dodoma", "Afrika"),
    "Thailand": ("Tayland", "Bangkok", "Asya"),
    "Timor-Leste": ("Doğu Timor", "Dili", "Asya"),
    "Togo": ("Togo", "Lomé", "Afrika"),
    "Trinidad and Tobago": ("Trinidad ve Tobago", "Port of Spain", "Kuzey Amerika"),
    "Tunisia": ("Tunus", "Tunus", "Afrika"),
    "Turkey": ("Türkiye", "Ankara", "Avrupa/Asya"),
    "Turkmenistan": ("Türkmenistan", "Aşkabat", "Asya"),
    "Uganda": ("Uganda", "Kampala", "Afrika"),
    "Ukraine": ("Ukrayna", "Kiev", "Avrupa"),
    "United Arab Emirates": ("Birleşik Arap Emirlikleri", "Abu Dabi", "Asya"),
    "United Kingdom": ("Birleşik Krallık", "Londra", "Avrupa"),
    "United States of America": ("Amerika Birleşik Devletleri", "Washington D.C.", "Kuzey Amerika"),
    "Uruguay": ("Uruguay", "Montevideo", "Güney Amerika"),
    "Uzbekistan": ("Özbekistan", "Taşkent", "Asya"),
    "Vanuatu": ("Vanuatu", "Port Vila", "Okyanusya"),
    "Venezuela": ("Venezuela", "Karakas", "Güney Amerika"),
    "Vietnam": ("Vietnam", "Hanoi", "Asya"),
    "W. Sahara": ("Batı Sahra", "Layun", "Afrika"),
    "Yemen": ("Yemen", "Sana", "Asya"),
    "Zambia": ("Zambiya", "Lusaka", "Afrika"),
    "Zimbabwe": ("Zimbabve", "Harare", "Afrika")
}

def clean_iso(name, iso):
    if iso == '-99' or not iso:
        if name == 'France': return 'fr'
        if name == 'Norway': return 'no'
        if name == 'N. Cyprus': return 'cy'
        if name == 'Somaliland': return 'so'
        if name == 'Kosovo': return 'xk'
    return str(iso).lower()

cleaned_countries = []

for f in data['features']:
    props = f['properties']
    name = props['NAME']
    iso = clean_iso(name, props.get('ISO_A2'))
    tr_info = tr_names.get(name, (name, "Bilinmiyor", props.get('CONTINENT', 'Dünya')))
    
    geom = f['geometry']
    gtype = geom['type']
    coords = geom['coordinates']
    
    # Extract rings & bounding box
    polys = []
    min_x, min_y, max_x, max_y = 180, 90, -180, -90
    
    if gtype == 'Polygon':
        raw_polys = [coords]
    else:
        raw_polys = coords
        
    for poly in raw_polys:
        # poly[0] is outer ring
        outer_ring = []
        p_min_x, p_min_y, p_max_x, p_max_y = 180, 90, -180, -90
        for pt in poly[0]:
            x, y = round(pt[0], 3), round(pt[1], 3)
            outer_ring.append([x, y])
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y
            if x < p_min_x: p_min_x = x
            if x > p_max_x: p_max_x = x
            if y < p_min_y: p_min_y = y
            if y > p_max_y: p_max_y = y
            
        polys.append({
            "bbox": [p_min_x, p_min_y, p_max_x, p_max_y],
            "ring": outer_ring
        })
        
    cleaned_countries.append({
        "id": iso,
        "name": name,
        "name_tr": tr_info[0],
        "capital": tr_info[1],
        "continent": tr_info[2],
        "bbox": [min_x, min_y, max_x, max_y],
        "polys": polys
    })

os.makedirs('public/data', exist_ok=True)
out_path = 'public/data/countries.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(cleaned_countries, f, ensure_ascii=False, separators=(',', ':'))

print(f"Saved {len(cleaned_countries)} countries to {out_path}, size: {os.path.getsize(out_path)} bytes")
