# Mendwise – UI Foundation Summary (v1)

Ten dokument podsumowuje decyzje wizualne i implementacyjne już wdrożone (Splash + fundamenty UI), aby utrzymać spójność na kolejnych ekranach.

## Co zrobiono
- Ekran `Splash` wdrożony z assetem `graph.assets/splash.hero.png`.
- Routing: niezalogowany użytkownik zawsze trafia na `/splash` (`app/_layout.tsx`).
- Ustalono tokeny: kolory, typografia, spacing, CTA, status bar, haptics.

## Pliki i zachowanie
- `app/_layout.tsx`: brak sesji → `/splash`; po logowaniu i zgodach → `/`.
- `app/splash.tsx`:
  - Tło: `#000000`; `StatusBar` w trybie `light`.
  - Hero: 100% szer., 62% wys. (po safe area); tylko dolne rogi radius 28; `overflow: hidden`; obraz `cover`.
  - H1: "SAVE CASH. FEEL CAPABLE." – Inter Black 28/34, all‑caps, letterSpacing 0.2, `#FFFFFF`.
  - Body: "Mendwise makes you handyman." – Inter Regular 14/20, `#B9B9B9`.
  - Primary CTA: h=56, r=28, bg `#27D969`, label Inter Semibold 18/22 `#0B0B0B`, wyśrodkowany; Haptics: Impact Light.
  - Spacing: padding L/R 24; pion 8/16/24; spacer dolny `max(16, insets.bottom)`.

## Kolory (HEX)
- `#000000` (background)
- `#FFFFFF` (nagłówki na dark)
- `#B9B9B9` (tekst pomocniczy)
- `#27D969` (primary CTA)
- `#0B0B0B` (tekst na CTA)

Zasady: zielony wyłącznie dla primary CTA; brak gradientów/cieni; minimalizm akcentów.

## Typografia
- Inter (preferowana); fallback: iOS SF Pro Display / Android Roboto.
- H1: Inter Black 28/34, all‑caps, letterSpacing 0.2, `#FFFFFF`.
- Body: Inter Regular 14/20, `#B9B9B9`.
- Button: Inter Semibold 18/22, `#0B0B0B`.

## Siatka i spacing
- Safe area obowiązkowo; StatusBar `light`.
- Padding poziomy: 24; pion: 8/16/24 (skala 4‑pt).
- Zasada: jeden główny CTA na ekran.

## Zależności
- `expo-haptics`, `expo-status-bar`, `react-native-safe-area-context`, `expo-router` (użyte na Splash).

## Nawigacja (skrót)
- Niezalogowany → `/splash` → CTA → `/signin`.
- Po logowaniu: `consented ? '/' : '/consents'`.

## Głos marki
- Krótki, sprawczy, przyjacielski; bez żargonu.
- Hasło przewodnie: "Save cash. Feel capable."
