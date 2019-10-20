# Multiplayer Game: Client #

1. Im Atom LiveServer starten und Verzeichnis game öffnen
2. Im Browser progsp_game.html aufrufen
3a. Server lokal: Im Browser hinter die URL ergänzen: http://127.0.0.1:3000/game/client/progsp_game.html?name=Benno
4a. Eine weiteres Browserfenster öffnen mit http://127.0.0.1:3000/game/client/progsp_game.html?name=Hugo und dann testen
3b. Server auf einem anderen Rechner mit IP Adresse 123.222.1.99: Im Browser hinter die URL ergänzen: http://127.0.0.1:3000/game/client/progsp_game.html?name=Benno&server=123.222.1.99
4b. Abwarten, das andere die oberen Schritte auch gemacht haben und dann zusammen spielen
5. Das Spiel verändern: js/progsp_game.js nach js/benno_game.js kopieren und ebenso progsp_game.html nach benno_game.html kopieren (und die js Datei verlinken!)
6. Anderen auch diese zwei Dateien geben und gemeinsam das neue Spiel testen
