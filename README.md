# 🇹🇷 İller Globle

[Globle](https://globle-game.com/) oyununun **Türkiye illeri** versiyonu. Gizli ili
tahmin et; her tahminde harita seni **ısıtır ya da soğutur** — hedefe yaklaştıkça
renkler maviden kırmızıya döner, ok hedefin yönünü gösterir.

## Modlar

- **Günün İli** — herkese aynı, günde bir gizli il. İlerlemen tarayıcıda saklanır.
- **Sınırsız Pratik** — rastgele il, istediğin kadar oyna, "Yeni oyun" ile devam et.

## Özellikler

- Türkiye'nin **81 ilinin** gerçek sınırları (GeoJSON), `d3-geo` ile SVG harita
- Kuş uçuşu (büyük daire) mesafeye göre **sıcaklık rengi** ve **yön oku**
- Tahminler en yakından uzağa sıralanır, yakınlık yüzdesi gösterilir
- **Türkçe karakter** ve kısa/alternatif adlar çalışır (Antep, Maraş, Urfa, İçel…)
- Sonucu emojili şeritle **paylaş**
- Bağımlılıksız, tamamen istemci tarafında — sunucu gerektirmez

## Geliştirme

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # dist/ üretimi
npm run preview  # üretim derlemesini önizle
```

## Teknik

- **React 18** + **Vite**
- **d3-geo** (`geoTransform` ile equirectangular hizalama; sınır mesafesi 3B küresel)
- İl sınır verisi: [alpers/Turkey-Maps-GeoJSON](https://github.com/alpers/Turkey-Maps-GeoJSON) (`tr-cities.json`)
- Uydu zemini: NASA Blue Marble (Visible Earth, kamu malı) — Türkiye bölgesi
  kırpılıp gömüldü; iller equirectangular projeksiyonla görsele hizalanır ve
  görsel il siluetine kırpılır (keskin kıyı).

## Dosya yapısı

```
src/
  lib/
    provinces.js   # il verisi, Türkçe normalizasyon, alias'lar, mesafe
    game.js        # günün ili, hedef seçimi, sıcaklık rengi, tahmin değerlendirme
  components/
    TurkeyMap.jsx  # d3-geo SVG harita
    GuessInput.jsx # otomatik tamamlamalı tahmin kutusu
  data/
    provinces.geojson.json  # 81 il sınırı
  App.jsx          # oyun akışı, modlar, paylaşım
```
