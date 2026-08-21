# CLAUDE.md — Şehirle

Türkçe "Globle" — Türkiye'nin 81 ilinden gizli şehri tahmin etme oyunu. React + Vite.
Kullanıcıyla **Türkçe** konuş. Değişiklik sonrası: build → artifact publish → commit → push (aşağıya bak).

## Mimari (dosyalar)
- `src/App.jsx` — ana kontrolcü: mod (daily/practice), tahminler, won/gaveUp, tema, renk körü, tüm modal state'leri, `MAX_GUESSES=12`.
- `src/components/` — `TurkeyMap.jsx` (SVG kabartma harita), `GuessInput.jsx`, `StatsModal.jsx` (Günlük/Sınırsız sekmeli), `ResultModal.jsx` (sınırsız sonuç), `HowToModal.jsx`, `SettingsModal.jsx` (Tema açılır menü + Renk körü), `ModeModal.jsx` (Oyun modu popup: takvim/sonsuzluk).
- `src/lib/game.js` — `heatColor`, `TARGET_COLOR`/`TARGET_COLOR_CB`, `evaluateGuess`, `dailyProvince`, `randomProvince`.
- `src/lib/provinces.js` — il verisi, `borderDistanceKm` (en yakın sınır, 3B great-circle), `findProvince`, `MAX_BORDER_KM`.
- `src/lib/stats.js` — günlük (`KEY`) ve sınırsız (`KEY_PRACTICE`) ayrı istatistik; `DIST_BUCKETS` (1/2-3/4-6/7-9/10-12), `winPct` (0-100 clamp).
- `src/data/` — `satellite.js` (SAT_BOUNDS, base64 relief), `land.js` (kara maskesi).
- `src/styles.css` — tüm stiller + `:root[data-theme='dark']` koyu mod. `src/logo.png` (açık zemin referansı), `src/logo-dark.png` (kullanılan logo, her iki modda).

## Kurallar / davranış
- Renkler: uzak=krem → turuncu → kırmızı → bordo; doğru=yeşil `#3f8a2e` (renk körü=mavi `#1f6feb`). Isı skalasında MAVİ YOK.
- Buton/vurgu rengi: teal `--accent: #2f6f73`. Buton köşe yarıçapı 6px.
- Mesafe = en yakın SINIR mesafesi (merkez değil); komşular 0 km.
- Günlük ve Sınırsız istatistikleri tamamen ayrı. localStorage anahtarları `iller-globle:*`.
- Türkçe büyük harfte İ/I'ya dikkat; CSS `text-transform:uppercase` yerine düz yazılmış metin kullan.

## Build → Artifact → Push (her değişiklikte)
```
npm run build
node /tmp/assemble.mjs   # dist/index.html'i tek fragment'e çevirir (scratchpad'e yazar)
```
`/tmp/assemble.mjs` yoksa yeniden oluştur: CSS+JS'i inline eder, `<html>/<head>/<body>` EKLEMEZ (Artifact kendi iskeletini ekler), çıktı = `<style>…</style><div id="root"></div><script type="module">…</script>`.
Artifact URL (aynı kalır): `https://claude.ai/code/artifact/3fad436d-063a-4260-aa4a-28d0f05ba55c` (favicon 🇹🇷, title "Şehirle").
Playwright ile test için fragment'i `<!doctype html><html><head><meta charset=utf-8></head><body>…</body></html>` ile sar. Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Playwright pruned olursa `npm i --no-save playwright`.

## Git
- Geliştirme dalı: `claude/turkish-globle-turkey-provinces-ykxpm2`. PR merge edildiyse takip işi için `git fetch origin main && git rebase origin/main` sonra `git push --force-with-lease`.
- Sadece istenince PR aç/merge et (GitHub MCP: ToolSearch ile `mcp__github__*`). Repo: `bozkus24/trpuzzle3`.

## Ortam
- Dış erişim kısıtlı; npm registry ve raw.githubusercontent.com erişilebilir. Görseller/fontlar base64 gömülü (Artifact CSP dış host engelli).
