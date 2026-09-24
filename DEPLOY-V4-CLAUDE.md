# Bierdeckel x LEO – v4 (Claude statt Perplexity)

Stand: 24.09.2026

## Warum jetzt

Perplexity stellt die Sonar-Chat-Completions-API am **27.09.2026** ein. Genau darüber lief `generate-brief.js`. Ohne Umstellung liefert die App ab dann nur noch Fehler.

## Was sich geändert hat

**Backend** – `netlify/functions/generate-brief.mjs`
- Claude API (Anthropic) statt Perplexity. Standardmodell: `claude-sonnet-5`.
- Streaming: Der Brief baut sich live auf, statt 30 Sekunden Spinner.
- LEO-Prompt (25 Prinzipien, Listen / Elevate / Own) ist unverändert übernommen.
- Eingaben sind begrenzt (8.000 / 3.000 Zeichen). Schützt dein API-Budget.
- Kein `Access-Control-Allow-Origin: *` mehr. Fremde Websites können deine Function nicht mehr aus dem Browser anzapfen.

**Frontend** – `public/index.html`
- Liest den Stream und rendert live.
- Sicherer Markdown-Renderer: Text wird erst escaped, dann formatiert. Vorher konnte HTML aus Eingabe oder KI-Antwort direkt in die Seite rutschen.
- `# CREATIVE BRIEF`, `---` und Listen werden jetzt sauber dargestellt (vorher als Rohtext bzw. kaputtes HTML).
- Datenschutz-Hinweis stimmt jetzt. Vorher stand da „Keine Cloud, keine Weitergabe“, obwohl jeder Text an Perplexity ging.
- Die Schrift wurde vorher vom Perplexity-Server geladen (`r2cdn.perplexity.ai`). Das ist nicht deine Lizenz und hätte jederzeit wegbrechen können. Jetzt: Systemschrift (SF Pro auf Apple, sonst Helvetica/Arial).
- „Deine letzten Briefs“ überleben jetzt einen Reload (localStorage). Vorher war nach F5 alles weg.

**Struktur**
- Nur noch `public/` geht online. Vorher war `publish = "."` – damit lagen alle .md-Dateien öffentlich im Netz, inklusive API-Key.
- `_archiv-v3-perplexity/` enthält die alte Function, die alte index.html und die nie genutzten `script.js` / `styles.css`.
- `package.json`: axios und netlify-cli raus (wurden nicht gebraucht). Node 22.

## Go-Live in 5 Schritten

1. **Alten Perplexity-Key widerrufen.** perplexity.ai → API → Keys. Der Key stand im Klartext in drei Doku-Dateien und war vermutlich öffentlich.
2. **Claude-API-Key holen.** platform.claude.com → API Keys → neuen Key erstellen. Dort direkt unter Limits ein Monatslimit setzen, z. B. 20 $.
3. **Key in Netlify eintragen.** Site configuration → Environment variables:
   - `ANTHROPIC_API_KEY` = dein neuer Key
   - `PERPLEXITY_API_KEY` löschen
   - optional `CLAUDE_MODEL` = `claude-haiku-4-5-20251001`, falls Sonnet zu langsam ist
4. **Deployen, per CLI, nicht per Drag & Drop.** Drag & Drop führt keinen Build aus; ob die Function dabei mitkommt, ist nicht garantiert. Im Terminal, in diesem Ordner:
   ```
   npx netlify-cli login
   npx netlify-cli link          # Site "marcels-bierdeckel" auswählen
   npx netlify-cli deploy --prod
   ```
5. **Testen.**
   - Deutscher Input → Brief auf Deutsch, Überschriften sauber, Text läuft live ein
   - Englischer Input → Brief auf Englisch
   - Seite neu laden → Brief steht unter „Deine letzten Briefs“
   - `marcels-bierdeckel.netlify.app/SUMMARY.md` → darf nur noch die App zeigen, nicht die Doku

## Kosten (geschätzt, nicht gemessen)

Der LEO-Prompt hat rund 7.400 Zeichen, ein Brief wird etwa 2.000–3.500 Tokens lang. Mit Sonnet 5 (2 $ / 10 $ pro Mio. Tokens) sind das grob **3–5 Cent pro Brief**. Mit Haiku 4.5 etwa die Hälfte. Die echten Zahlen siehst du nach den ersten Briefs in der Claude Console.

## Zeitlimit

Netlify bricht Functions nach 60 Sekunden ab. Thinking ist deshalb ausgeschaltet. Kommt ein Brief trotzdem abgeschnitten an („Verbindung abgebrochen“), gibt es zwei Hebel: `CLAUDE_MODEL` auf Haiku setzen oder den Prompt kürzen.

## Offene Punkte (Vorschläge, noch nicht umgesetzt)

- **Datenschutzerklärung / Impressum** verlinken. Texte gehen an Anthropic (USA). Für eine öffentliche App in DE brauchst du das.
- **Rate-Limit pro Nutzer.** Die Function ist öffentlich. Das Monatslimit in der Console ist das Sicherheitsnetz, ein echtes Rate-Limit wäre der nächste Schritt.
- **Prompt Caching.** Der LEO-Prompt ist bei jedem Brief gleich. Mit Caching wird der Input-Teil deutlich billiger und schneller.
- **Eigene Schrift.** Wenn du FK Grotesk Neue willst: Lizenz kaufen, woff2 nach `public/fonts/` legen, `@font-face` wieder rein.
- Die alten Docs (ARCHITECTURE, SUMMARY, QUICKSTART …) beschreiben noch Perplexity. Sie sind nicht mehr maßgeblich, diese Datei ersetzt sie.
