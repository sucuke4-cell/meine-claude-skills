# Meine Claude-Skills

Dein persönliches Skill-Paket: **20 Skills** in einem Ordner.

## Was drin ist

| Bereich | Skills | Woher |
|---|---|---|
| **Chef-Regeln** | `mein-assistent`: wählt den passenden Skill, erklärt auf einfachem Deutsch, fragt vor Kosten | neu, für dich |
| **Videos** | `social-video`: Ideen, Hooks, Skripte, KI-Prompts, Hashtags (Englisch, 9:16) | neu, für dich |
| | `watch`: sieht Videos an und analysiert sie (nur Claude Code) | claude-video |
| **Webseiten & Design** | `ui-ux-pro-max`, `ui-styling`, `design-system`, `design`, `brand`, `banner-design`, `slides` | UI/UX Pro Max |
| | `webseite-online`: kostenlos online stellen, Impressum, Link-in-Bio | neu, für dich |
| **Investieren** | `depot-check`, `sparplan-optimierer`, `aktien-check`, `insider-radar`, `politiker-tracker`, `earnings-analyst`, `klumpen-finder`, `copy-trader-check`, `wochen-ritual` | Depot-Skills von Lenny Investiert |

Du musst die Namen nicht kennen. Sag einfach, was du willst, z. B. „Mach mir 5 Story-Ideen“.

## Installieren

### Am Handy (Claude-App / claude.ai)
1. In der Claude-App: **Einstellungen → Capabilities**: **Code-Ausführung** und **Websuche** einschalten.
2. Im Ordner [`download/`](download/) liegt jeder Skill als ZIP. Lade jede ZIP unter **Einstellungen → Capabilities → Skills** hoch. Fang mit `mein-assistent`, `social-video`, `ui-ux-pro-max` und `webseite-online` an.
3. `watch` gibt es dort nicht, der läuft nur in Claude Code (siehe Laptop).

### Am Laptop (Claude Desktop, Code-Bereich, oder Terminal)
Im Terminal:
```
claude plugin marketplace add sucuke4-cell/meine-claude-skills
claude plugin install meine-skills@meine-claude-skills
```
Oder in Claude Desktop: **Customize → Plugins → Add → aus Repository** und `sucuke4-cell/meine-claude-skills` eintragen. Danach **meine-skills** installieren.

Für `watch` braucht der Laptop Python 3.10+, ffmpeg und yt-dlp. Sag Claude: „Richte watch ein“, dann hilft es dir dabei.

## Neue Skills hinzufügen
Neuen Skill-Ordner nach `skills/` legen und `tools/make-zips.sh` ausführen (erzeugt die ZIPs neu). Oder sag einfach Claude: „Füg diesen Skill zu meinem Skill-Repo hinzu“ und gib den Link oder die ZIP.

## Wichtig
- Die Depot-Skills sind **keine Anlageberatung**. Investieren kann zum Totalverlust führen.
- Viral-Erfolg und Umsatz kann niemand garantieren: testen, messen, verbessern.

## Quellen & Lizenzen
Alle übernommenen Skills stehen unter der MIT-Lizenz, siehe [`licenses/`](licenses/):
- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (Stand: Commit `11ca2b3`)
- claude-video (`watch`) von Bradley Bonanno: https://github.com/bradautomates/claude-video (v0.3.2)
- Depot-Skills von Lenny Investiert: https://github.com/finanzlenny-ui/claude-depot-skills
