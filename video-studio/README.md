# Video-Studio: „Never Open the Red Door“

Hier entstehen deine Story-Videos, komplett kostenlos und automatisch:
- **3D-Animation** mit Klötzchen-Figuren
- **KI-Stimmen**
- **Untertitel**
- **Musik und Soundeffekte**

## Folgen
| Folge | Länge | Ordner | Video |
|---|---|---|---|
| Part 1: Die Regel | 46 s | `episodes/part1` | Branch `videos` → `videos/Never_Open_The_Red_Door_Part1.mp4` |
| Part 2: Hinter der Tür | 94 s | `episodes/part2` | Branch `videos` → `videos/Never_Open_The_Red_Door_Part2.mp4` |

## Neue Folge machen
Sag Claude in Claude Code (Laptop oder Cloud-Session mit diesem Repo):
> „Mach Part 3 von Never Open the Red Door“

Claude nutzt dann den Skill `story-video-studio`. Der Skill erklärt Schritt für Schritt, wie eine Folge entsteht und wie die Figuren aussehen.

## Technik (für Claude)
```
./setup.sh                      # einmalig
./build.sh episodes/part2       # Stimme → Ton → Bilder → out/part2.mp4
```
Stimmen: Kokoro TTS (Apache-2.0), wird von `setup.sh` heruntergeladen. Die Musik wird im Code erzeugt (`shared/music.py`), deshalb gibt es keine Lizenzprobleme.
