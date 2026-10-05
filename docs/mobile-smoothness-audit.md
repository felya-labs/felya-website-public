# FELYA Mobile Smoothness Audit

**Basis:** Preview `https://preview.felya.com/en/`, Commit `03a50168b927e396ea31122f01f2c8c3c935e9ed`  
**Status:** Analyse und experimentelle Messung abgeschlossen. Keine Produktdatei geändert, kein Commit, kein Push und kein Deploy durchgeführt.

## Kurzfazit

Der aktuelle Preview-Stand hat keinen offensichtlichen, dauerhaft aktiven JavaScript-Long-Task, der die mobile Scroll-Interaktion allein erklärt. Die wahrscheinlichsten Ursachen für wahrnehmbares Ruckeln liegen stattdessen in **raster-/compositor-lastigen Effekten**, die sich beim Eintreten in bestimmte Bereiche zeitlich überlagern: System-Demo (Masken, SVG, aktivierte Signalpakete), Prototypes-Video (große Blurs, Masken/Blendmode und Backdrop-Blur) und die animierte Erde nach dem Beyond-Earth-Trigger.

Der geschlossene Header ist kein prioritärer Kandidat: Das temporäre Entfernen seines Backdrop-Filters änderte im kontrollierten Test keine Schwelle über 25 ms. Das mobile Menü und der Sprachdialog bleiben dennoch teuer, wenn sie geöffnet sind; sie gehören nicht zum normalen Scrollpfad.

Die synthetische Messung blieb in allen vier A/B-Szenarien unter 25 ms. Das ist **kein physischer Mobile-Sign-off**: sie deckt weder echte GPU-Rasterisierung noch Touch-Input-Latenz oder thermisches Throttling eines konkreten Geräts ab.

## Messrahmen und Schwellen

| Schwelle | Bedeutung |
| --- | --- |
| ≤16,7 ms | 60-fps-Budget |
| >16,7 ms | sichtbares Risiko bei 60 Hz |
| >25 ms | klarer Smoothness-Verlust |
| >33 ms | unter 30 fps |
| >50 ms | deutlicher Hänger |

Kontrollierter Test: lokaler Produktions-Build, Chrome 393×851 CSS-Pixel, DPR 2, Touch-Viewport, CPU×4. Je Bereich wurde rund 1,5 s mit kurzen gegenläufigen Scrollbewegungen gemessen. Vollständige Roh-Zusammenfassung: `mobile-smoothness-audit-results.json`.

| Szenario | p50 / p95 | >25 / >33 / >50 ms | Einordnung |
| --- | ---: | ---: | --- |
| System aktiv | 16,7 / 16,7 ms | 0 / 0 / 0 | kein synthetischer Frame-Verlust |
| System: CSS pausiert, Filter aus | 16,7 / 16,8 ms | 0 / 0 / 0 | Testmaschine trennt GPU-Rasterkosten nicht gut genug |
| Videoeffekte stumm | 16,7 / 16,7 ms | 0 / 0 / 0 | kein Beweis gegen echten Geräte-Rasterdruck |
| Header-Backdrop aus | 16,7 / 16,7 ms | 0 / 0 / 0 | geschlossener Header keine Hauptspur |

Vergleichssignal aus dem bestehenden Performance-Audit: Mobile Lighthouse Median 76, Main-thread 2.799 ms; Mobile-Slow 63, Main-thread 5.683 ms. TBT blieb 0. Das stützt die Diagnose: Der Engpass ist eher visuelle, zeitlich lokale Arbeit als ein großer Start-up-Long-Task.

## Ursachenprofil nach Bereich

| Rang | Bereich / Auslöser | Mechanismus | Risiko | Empfehlung für nächsten Test |
| ---: | --- | --- | --- | --- |
| 1 | System-Demo, sichtbarer Start/Interaktion | mehrere WebP-Masken, SVG, Signalpakete per rAF, Filter/Drop-Shadows; bei Aktivierung gleichzeitig DOM-/Attributupdates | hoch, lokal und ereignisgebunden | Animation während aktivem Scrollen pausieren; danach echte Geräteaufnahme |
| 2 | Prototypes-Video im Viewport | 120px mobiler Glow-Blur, 24px Reflection-Blur + Mask/Blendmode, 22px CTA-Backdrop-Blur, große Schatten | hoch, vor allem auf schwachen iOS-/Android-GPUs | Glow/Reflection/CTA einzeln per DevTools abschalten und vergleichen |
| 3 | Beyond Earth | Erde aktualisiert SVG-Pfad mit 30 Hz auf Mobile; zusätzlich 56 CSS-Starfield-Streaks erst nach Trigger | mittel bis hoch, nur nach Trigger | 30 Hz gegen 15 Hz und pausiert vergleichen; nur sichtbare Ansicht laufen lassen |
| 4 | Reveal-Blöcke beim ersten Einblenden | 650 ms Opacity + translate; compositor-freundlich, aber mehrere Eintrittsanimationen können zusammentreffen | mittel | Reduktion oder gestaffeltes Reveal nur auf Mobile testen |
| 5 | Bild-/Dekodierarbeit beim Abschnittseintritt | Future- und Partnerbilder werden viewportnah geladen; Video kann decodieren | mittel | Netzwerk-/Decode-Spur auf echter Hardware erfassen |
| 6 | Offene Navigation / Dialog | 20–28px Backdrop-Blur, feste Overlays | hoch bei offenem UI, nicht bei normalem Scroll | getrennt testen, nicht als primäre Scrollursache behandeln |

### System-Demo

Dies ist der stärkste Kandidat, wenn der Ruckler beim Übergang in „PATON closes the loop“ oder beim Antippen auftritt. Die Kompaktversion erzeugt sieben Signalpakete und schreibt deren SVG-Transform pro `requestAnimationFrame`; beim Aktivieren kommen Layoutmessungen und Signal-/Haptikzustände hinzu. Sichtbar sind zugleich maskierte Operator-/Robot-Layer, ein maskiertes Grid und Signalfilter. Die `IntersectionObserver`-Logik startet die Animation beim Sichtbarwerden, sodass sie genau mit Scrollarbeit kollidieren kann.

Temporärer A/B-Vorschlag: beim Scrollen `animation-play-state: paused` für die Signal-/Feedbackeffekte und keine neue Awakening-Sequenz starten; beim Scrollende bzw. stabil sichtbaren Bereich fortsetzen. Die Steuerung muss `prefers-reduced-motion` und die bestehende Sichtbarkeitslogik beibehalten.

### Prototypes / Video

Der mobile Kamera-Drift ist bereits abgeschaltet. Übrig bleiben jedoch die großen, statischen bzw. beim Aktivieren animierten Flächen: `filter: blur(120px)` auf dem Stage-Glow, `filter: blur(24px)` plus `mix-blend-mode: screen` und Maskierung für die Reflection sowie `backdrop-filter: blur(22px)` auf dem CTA. Große Blur-/Backdrop-Flächen sind typischerweise GPU-/Raster-kritisch, auch wenn sie nicht als Main-thread-Long-Task erscheinen.

Temporärer A/B-Vorschlag: erst Reflection, dann Stage-Glow, dann CTA-Backdrop einzeln deaktivieren; Screenshot und Scroll-Timeline pro Variante vergleichen. Eine echte Optimierung erst nach diesem Vergleich entscheiden.

### Hero, Erde, Starfield und Glove

Der Mobile-Glove schreibt nur nahe des Heroes einen CSS-Wert pro rAF. Die Erde ist auf Mobile bereits auf **30 Hz** begrenzt. In früheren kontrollierten Messungen lag der mediane Skriptanteil bei ungefähr 0,9 ms pro Update (DPR 2); der pausierte Modus erzeugte 0 Ticks. Damit ist eine Pause außerhalb des Viewports bereits richtig umgesetzt und eine Senkung auf 15 Hz eine plausible, aber nicht automatisch nötige A/B-Variante.

Das Starfield erzeugt erst nach `felya:beyondearth` 56 transform-/opacity-animierte Streaks. Im Default-Fall hat es keine DOM-/Animationskosten. Im aktivierten Zustand muss es mit Erde und möglichem Hero-Scroll konkurrieren; deshalb separat messen.

### Partner, Reveals und Video

Partner-Interaktionen werden für Touch bei `pointerenter` abgefangen; sie sind nicht die wahrscheinliche Ursache des normalen Scrollruckelns. Bilder bleiben beim Abschnittseintritt ein Decode-/Netzwerkfaktor. Reveal-Blöcke nutzen nur Opacity und Transform und sind deshalb deutlich weniger verdächtig als Blur/Masken/SVG, können aber in einer dichten Scrollbewegung Überlappungen erzeugen.

## A/B-Matrix für die nächste Ausführung

| Experiment | Was bleibt konstant | Variable | Erwarteter Erkenntniswert |
| --- | --- | --- | --- |
| Header | geschlossene Header-Geometrie | Backdrop aus | niedrig; aktuelle Emulation neutral |
| System scroll-pause | visuelles Layout | Signale/Filter nur während Scroll pausieren | sehr hoch |
| System reduced complexity | Interaktionsablauf | keine Pakete/kein Sparkle auf Mobile | hoch |
| Video glow | Film und CTA | 120px Glow aus | hoch |
| Video reflection | Film und CTA | Reflection/Mask/Blendmode aus | hoch |
| Video CTA | Film | Backdrop-Blur aus | mittel |
| Reveals | Inhalt/Reihenfolge | sofort sichtbar vs. 650 ms | mittel |
| Erde | Visual/Viewport | 30 Hz vs. 15 Hz vs. pausiert | mittel |
| Starfield | Beyond-Earth-Zustand | 56 vs. weniger vs. aus | mittel |
| Partner | Logos/Netzwerk | Touch-Listener/near-load aus | niedrig bis mittel |

## Real-Device-Profiling für den Sign-off

1. Je ein iPhone (Safari) und ein Android-Mittelklassegerät (Chrome), beide 60 Hz; Browser ohne Debug-Overhead starten.
2. Vier reproduzierbare Läufe als Bildschirmaufnahme mit Touch-Indikator: Hero→System, System-Interaktion, Why→Prototypes, Prototypes→Partners→Futures; danach Beyond Earth aktivieren.
3. In Safari Web Inspector bzw. Chrome Remote Debugging jeweils Performance-Trace mit Frames, Main, Rendering, Raster und Screenshots aufnehmen. Für Android zusätzlich `adb shell dumpsys gfxinfo`/Perfetto; für iOS den Instruments-/Web-Inspector-Export sichern.
4. Je Szenario drei Durchläufe: cold, warm, nach 2 Minuten Nutzung. Werte für Frames >16,7/>25/>33/>50 ms, Long Tasks, Paint/Raster, Image Decode, Video Decode und Input Delay notieren.
5. Zuerst System-scroll-pause und Video-Reflection/Glow A/B testen. Nur einen Effekt pro Lauf ändern, gleiche Scrollgeste und gleiche Gerätebedingungen.

## Entscheidung

Kein produktiver Change wird aus diesem Audit abgeleitet. Die nächste Änderung sollte erst erfolgen, wenn ein echtes Gerät den Ruckler einem der priorisierten Bereiche zuordnet. Der wahrscheinlich beste erste Kandidat ist eine mobile **Scroll-Pause der System-Signal-/Feedbackanimation**, gefolgt von einer Reduktion der **Prototypes-Blur-/Reflection-/Backdrop-Effekte**.
