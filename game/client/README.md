# Multiplayer Game: Client #

## Multiplayer Game: Spiel entwickeln und testen ##
1. Im Verzeichnis 'game/server' den gameserver starten (siehe 'game/server/README.md')
2. Im Atom LiveServer starten und Verzeichnis 'game/client' öffnen (In 'game/server' sollte nichts zu ändern sein!)
3. Im Browser progsp_game.html aufrufen
4. Um den Spielernamen zu ändern im Browser die URL ergänzen: http://127.0.0.1:3000/progsp_game.html?name=Benno
5. Eine weiteres Browserfenster öffnen mit http://127.0.0.1:3000/progsp_game.html?name=Hugo und dann das Spiel testen
6. Kopien mit anderem Namen von progsp_game.html und js/progsp_game.js erzeugen und verknüfen (in progsp_game.html)
7. Das neue Spiel im Browser öffnen (analog zu 4. und 5.)
8. Spiellogik ändern and testen, weitermachen bis das Spiel fertig ist

## Multiplayer Game: Spiel veröffentlichen und mit anderen spielen ##
1. Shift-P (Publish) lädt das Spiel auf den Server und es wird veröffentlicht
2. Wenn der gameserver nicht lokal gestartet wurde (ohne -local), sollten andere Spieler im gleichen Netz sofort auf das Spiel zugreifen können: http://<ServerIP>:8091
3. Abwarten, daß andere die Seite http://<ServerIP>:8091 geöffnet haben und dann zusammen spielen
