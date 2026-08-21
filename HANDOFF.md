# HANDOFF — Şehirle

Türkçe "Globle" (Türkiye 81 il). React + Vite. Genel proje kuralları için `CLAUDE.md`.
Dal: `claude/turkish-globle-turkey-provinces-ykxpm2`. Son commit `d408fed`. main ile senkron (PR #3 merge edildi).

## Mevcut durum
Oyun tamamen çalışır ve `main`'e merge edilmiş durumda. Bu daldaki son commit'ler (CLAUDE.md) main'e ötesinde; istenirse yeni PR ile alınır.

## Tamamlanan iş (öne çıkanlar)
- İki mod: **Günün Şehri** (günlük, deterministik) ve **Sınırsız** (rastgele). Mod seçimi sağ üstteki "Oyun modu" popup'ından (takvim/sonsuzluk).
- Mekanik: en yakın **sınır** mesafesine göre ısı rengi (komşu=0 km). Isı skalası krem→turuncu→kırmızı→bordo, doğru=yeşil. **12 tahmin sınırı** (bilinemezse şehir gösterilir).
- Kabartma harita (base64 relief + kara maskesi), 3B boyalı iller, son yazılan il 1.2 sn yanıp söner.
- Üst bar: sol logo+ŞEHİRLE, sağda ikonlar (oyun modu, ?, istatistik, ayarlar). Tahmin kutusu üstünde başlık: "Günün Şehri · 17 Ağustos 2026" / "Sınırsız #n".
- İstatistikler: **Günlük/Sınırsız ayrı** (sekmeli popup), özet kutuları + dağılım (1/2-3/4-6/7-9/10-12), günün sonucu kartı, Paylaş.
- Ayarlar: Tema (Açık/Koyu açılır menü) + Renk körü modu. **Koyu mod** haritayla uyumlu mavi-slate palet.
- Nasıl Oynanır popup (ilk açılışta otomatik, "bir daha gösterme"). Sınırsız için ayrı sonuç popup'ı.

## Önemli kararlar
- Renklerde ısı skalasında **mavi yok**; renk körü modunda doğru il mavi `#1f6feb`.
- Buton/vurgu **teal `#2f6f73`**, köşe 6px. Günlük ve sınırsız istatistik **ayrı localStorage** (`iller-globle:stats` / `:stats:practice`).
- Logo her iki modda `src/logo-dark.png`; koyu modda saydam zemin.
- Türkçe büyük harf İ/I: CSS uppercase yerine düz metin kullanıldı (ör. "GÜNÜN ŞEHRİ").
- Artifact tek fragment olarak publish edilir (kendi `<html>` etiketi eklenmez). URL sabit: `.../artifact/3fad436d-063a-4260-aa4a-28d0f05ba55c`.

## Bitmemiş / bekleyen iş
- **"Arşiv" isteği (AÇIK):** Kullanıcı üst panel ikonlarını "arşiv, istatistikler, nasıl oynanır, ayarlar" sırasına istedi. "Arşiv" belirsiz — (a) geçmiş günleri oynanabilir yeni bölüm mü, (b) mevcut ikonların yeniden sıralanması mı? Kullanıcıya soruldu, netleşmeyi bekliyor. Şu anki ikon sırası: oyun modu → ? → istatistik → ayarlar (`src/App.jsx` `.topbar-actions`).

## Bilinen sorunlar / notlar
- Dağılım kova sayısı değişirse eski localStorage `dist` sıfırlanır (uzunluk uyuşmazlığında). `winPct` legacy veriyi normalize eder (%100 clamp) — çözülmüş.
- Dış erişim kısıtlı; asset'ler base64 gömülü olmalı (Artifact CSP). Playwright test: fragment'i html ile sar, Chromium `/opt/pw-browsers/chromium-1194/...`.
- Build/publish/push akışının tamamı `CLAUDE.md`'de.
