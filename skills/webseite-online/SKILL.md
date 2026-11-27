---
name: webseite-online
description: "Puts a finished website online for free and explains it step by step to a beginner in German: choosing free hosting (Cloudflare Pages, Netlify, GitHub Pages), uploading from phone or laptop, optional own domain, link-in-bio page for TikTok/YouTube, basic legal pages for Germany (Impressum, Datenschutz), and simple visitor counting. Use when the user wants to publish, host, deploy, put online, share a link to their website, connect a domain, or build a link-in-bio page."
---

# Webseite online stellen – kostenlos

Mit dem Nutzer **einfaches Deutsch**, Webseiten-Inhalte **Englisch**. Spar-Regel aus `mein-assistent` gilt: alles hier geht **kostenlos**; nur die eigene Domain kostet Geld (vorher fragen).

## 1. Welche Seite zuerst?
Für TikTok/YouTube-Creator am sinnvollsten: **Link-in-Bio-Seite** (eine Seite: Kanal-Logo, kurzer Satz, Buttons zu TikTok, YouTube, neuesten Videos, später Shop/Produkte). Mit `ui-ux-pro-max` + `ui-styling` als **eine einzige `index.html`** bauen (HTML + Tailwind, mobile-first). Bilder in einem Ordner daneben.

## 2. Kostenlos online stellen
Wichtig: Ein **privates** GitHub-Repo bekommt mit dem Gratis-Konto **kein** GitHub Pages. Deshalb:

| Weg | Gut für | Wie |
|---|---|---|
| **Netlify Drop** (app.netlify.com/drop) | Laptop, schnellster Start | Ordner mit `index.html` ins Browserfenster ziehen → Link fertig. Kostenloses Konto anlegen, damit die Seite bleibt. |
| **Cloudflare Pages** | dauerhaft, schnell, gratis | Konto anlegen → Workers & Pages → Projekt erstellen → Dateien hochladen oder mit GitHub-Repo verbinden. |
| **GitHub Pages** | wenn das Webseiten-Repo **öffentlich** sein darf | Repo → Settings → Pages → Branch `main` wählen. |

Vom Handy aus: Claude in einer Cloud-Session kann die Seite in ein GitHub-Repo pushen; Cloudflare Pages mit dem Repo verbinden → jede Änderung geht automatisch online.

## 3. Eigene Domain (optional, kostet)
Erst wenn der Kanal läuft. Kosten pro Jahr beim Anbieter prüfen (z. B. Cloudflare Registrar, Namecheap) und **vor dem Kauf fragen**. Dann in Cloudflare/Netlify unter „Custom domain“ verbinden.

## 4. Rechtliches in Deutschland (wichtig!)
Sobald die Seite geschäftlich ist (Werbung, Verkauf, Affiliate-Links – also bei Geldverdienen fast immer): **Impressum** und **Datenschutzerklärung** nötig. Kostenlose Generatoren nutzen (z. B. e-recht24-Generator, Datenschutz-Generator.de) und Seiten verlinken. Claude ist kein Anwalt – bei Unsicherheit prüfen lassen. Gewerbeanmeldung/Steuern beim Geldverdienen ansprechen und auf offizielle Stellen verweisen.

## 5. Besucher zählen
Ohne Cookie-Banner und kostenlos: **Cloudflare Web Analytics** (bei Cloudflare Pages ein Klick). In TikTok/YouTube-Links bei Bedarf `?ref=tiktok` / `?ref=youtube` anhängen, um die Quelle zu sehen.

## 6. Checkliste vor dem Teilen
- Am Handy getestet (kein seitliches Scrollen, Buttons groß genug)
- Alle Links funktionieren
- Impressum + Datenschutz verlinkt (wenn geschäftlich)
- Link in TikTok-Bio und YouTube-Kanalbeschreibung eingetragen
