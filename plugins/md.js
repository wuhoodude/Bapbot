/**
 * @license MIT license
 */

'use strict';

/**
 * @param {User} user
 * @param {Room | string} room
 * @return {boolean}
 */
function canRoastban(user, room) {
	return user.isDeveloper() || user.hasRank(room, '#');
}
function canBop(user, room) {
	return user.isDeveloper() || user.hasRank(room, '@');
}
/**
 * Obtains the given room's database. If the quotes database
 * wasn't already initialised, then it is done here.
 * @param {Room | string} room
 * @return {AnyObject}
 */
function getDatabase(room) {
	// In case a Room object was passed:
	if (room instanceof Rooms.Room) room = room.id;
	let database = Storage.getDatabase(room);
	if (!database.roasts) database.roasts = [];
	if (!database.roastbans) database.roastbans = [];
	if (!database.gifs) database.gifs = [];
	if (!database.bapbans) database.bapbans = [];
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	// Roasts
	roastban: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return;
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.roastban username``");
		if (Tools.toId(target) === user.id && canRoastban(user, room)) return;
		let roastbans = database.roastbans;
		let index = roastbans.findIndex(/**@param {string} roastban */ roastban => Tools.toId(roastban) === Tools.toId(target));
		if (index >= 0) return this.say("That user is already banned from using roast commands.");
		roastbans.push(target);
		Storage.exportDatabase(room.id);
		this.say("" + target + " was successfully banned from using roasting commands.");
	},
	roastunban: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return;
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.roastunban username``");
		let roastbans = database.roastbans;
		let index = roastbans.findIndex(/**@param {string} roastban */ roastban => Tools.toId(roastban) === Tools.toId(target));
		if (index < 0) return this.say("That user is already unbanned from using roast commands.");
		roastbans.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("" + target + " was successfully unbanned from using roasting commands.");
	},
	roastbans: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return;
		let roastbans = getDatabase(room.id).roastbans;
		if (!roastbans.length) return this.pm(user, "Room '" + room.id + "' doesn't have any roastbans.");
		let prettifiedQuotes = "Roastbans for '" + room.id + "':\n\n" + roastbans.map(
			/**
			 * @param {string} roastban
			 * @param {number} index
			 */
			(roastban, index) => (index + 1) + ": " + roastban
		).join("\n");
		Tools.uploadToHastebin(prettifiedQuotes, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.pm(user, "Roastbans: " + hastebinUrl);
		});
	},
	addroast: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return this.say("You are not allowed to use roast commands");
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.addroast roast``");
		let roasts = database.roasts;
		let index = roasts.findIndex(/**@param {string} roast */ roast => Tools.toId(roast) === Tools.toId(target));
		if (index >= 0) return this.say("That roast already exists.");
		if (!target.includes('{user}')) return this.say("Your roast doesn't have the characters ``{user}`` in it. (``{user}`` is used to locate where the target username goes when you use ``.roast {user}``)");
		if (target[0] === '/') return this.say("Roasts aren't allowed to start with slashes.");
		for (const letter of target.replace(' ', '')) {
			if (target[target.indexOf(letter) + 1] === letter &&
				target[target.indexOf(letter) + 2] === letter &&
				target[target.indexOf(letter) + 3] === letter) {
				return this.say("Please don't put spam as a roast.");
			}
		}
		roasts.push(target);
		Storage.exportDatabase(room.id);
		this.say("Your roast was successfully added.");
	},
	removeroast: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return this.say("You are not allowed to use roast commands");
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.removeroast roast``");
		let roasts = database.roasts;
		let index = roasts.findIndex(/**@param {string} roast */ roast => Tools.toId(roast) === Tools.toId(target));
		if (index < 0) return this.say("Your roast doesn't exist in the database.");
		roasts.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("Your roast was successfully removed.");
	},
	roast: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return this.say("You are not allowed to use roast commands");
		let roasts = database.roasts;
		if (!roasts.length) return this.say("This room doesn't have any roasts.");
		if (!target) return this.say("Correct syntax: ``.roast username``");
		if (Tools.toId(target) === 'bapbot') return this.say("YoU cAnNoT rOaSt Me");
		if (target.length > 18) return this.say("Please use a real username.");
		if (target[0] === '/') return this.say("Usernames aren't allowed to start with slashes.");
		this.say(Tools.sampleOne(roasts).replace(/{user}/g, target));
	},
	roasts: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return;
		let roasts = database.roasts;
		if (!roasts.length) return this.say("This room doesn't have any roasts.");
		let prettifiedQuotes = "Roasts for " + room.id + ":\n\n" + roasts.map(
			/**
			 * @param {string} roast
			 * @param {number} index
			 */
			(roast, index) => (index + 1) + ": " + roast
		).join("\n");
		Tools.uploadToHastebin(prettifiedQuotes, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.say("Roasts: " + hastebinUrl);
		});
	},
	// Fun commands
	bap: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.bapbans.includes(Tools.toId(user))) return this.say("You are not allowed to bap");
		if (!target) return this.say("BAP");	
		if (['~', '~~', 'crossout', 'strikethrough'].includes(target)) return this.say("~~BAP~~");
		if (['*', '**', 'bold', 'strong'].includes(target)) return this.say(" **BAP**");
		if (['_', '__', 'emphasis', 'italic'].includes(target)) return this.say(" __BAP__");
		if (['^', '^^', 'carrot', 'superscript'].includes(target)) return this.say("^^BAP^^");
		if (['\\', '\\\\', 'subscript'].includes(target)) return this.say("\\\\BAP\\\\");
		if (['`', '``', 'code', 'inline'].includes(target)) return this.say("``BAP``");
		if (['>', 'greentext', 'memearrow'].includes(target)) return this.say(">BAP");
		if (['/', 'me', 'roleplay', '/me'].includes(target)) return this.say("/me baps");
		if (['d', 'drama', 'dramatic'].includes(target)) return this.say("/me baps in the distance, waiting for the bap to return");	
		if ([':', 'spoil', 'spoiler'].includes(target)) return this.say("spoiler:BAP");
		if (['[', '[[', 'link'].includes(target)) return this.say("[[BAP]]");
		if (['w', 'wall'].includes(target)) return this.say("/wall BAP");
		if (['bapbot'].includes(target)) return this.say("^^B^^\\\\a\\\\P \\\\b\\\\A^^p^^b\\\\o\\\\t");
		if (['m', 'mock'].includes(target)) return this.say("^^B^^\\\\a\\\\P");
		if (Number.parseInt(target) > 3) return this.say("The maximum baps per bap is 3");
		if (Number.parseInt(target) <= 3)  {
			for (let i = 0; i < target; i++) {
				this.say("BAP");
			}
			return;
		}
		this.say("It's a ~~TRAP~~ BAP!!");
		for (var n = 0; n < 5 ; n++){
			this.pmHtml(user, '<div style="color:#eeeeee;background-color:#003399;font-size:20px;overflow: visible;"><marquee behavior="alternate"<b>YOU ACTIVATED MY BAP CARD</b></marquee></div>');
		}
	
	},
	bapban: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return;
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.bapban username``");
		if (Tools.toId(target) === user.id && canRoastban(user, room)) return;
		let bapbans = database.bapbans;
		let index = bapbans.findIndex(/**@param {string} roastban */ bapban => Tools.toId(bapban) === Tools.toId(target));
		if (index >= 0) return this.say("That user is already banned from bapping.");
		bapbans.push(target);
		Storage.exportDatabase(room.id);
		this.say("" + target + " was successfully banned from bapping.");
	},
	bapunban: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return;
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.bapunban username``");
		let bapbans = database.bapbans;
		let index = bapbans.findIndex(/**@param {string} bapban */ bapban => Tools.toId(bapban) === Tools.toId(target));
		if (index < 0) return this.say("That user is already unbanned from bapping.");
		bapbans.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("" + target + " can bap now.");
	},
	bapbans: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return;
		let bapbans = getDatabase(room.id).bapbans;
		if (!bapbans.length) return this.pm(user, "Room '" + room.id + "' doesn't have any bapbans.");
		let prettifiedQuotes = "Bapbans for '" + room.id + "':\n\n" + bapbans.map(
			/**
			 * @param {string} roastban
			 * @param {number} index
			 */
			(bapban, index) => (index + 1) + ": " + bapban
		).join("\n");
		Tools.uploadToHastebin(prettifiedQuotes, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.pm(user, "Bapbans: " + hastebinUrl);
		});
	},
	math: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say("!dice 100+100");
		this.say("!dice 6d13");
	},
	//gifs That Bot can show 
	addgif: function (target, room, user) {
		if (room instanceof Users.User) return;
		if (!target.trim().toLowerCase().endsWith('.gif')) return this.say("Please provide a gif");
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say("Please use the following format: .addgif giflink");
		let gifs = database.gifs;
		let index = gifs.findIndex(/**@param {string} gif */ gif => Tools.toId(gif) === Tools.toId(target));
		if (index >= 0) return this.say("That gif already exists.");
		gifs.push(target);
		Storage.exportDatabase(room.id);
		this.say("Your gif was successfully added.");
		
	},
	removegif: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+')) return this.say("You are not allowed to use gif commands");
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.removegif giflink``");
		let gifs = database.gifs;
		let index = gifs.findIndex(/**@param {string} gif */ gif => Tools.toId(gif) === Tools.toId(target));
		if (index < 0) return this.say("Your gif doesn't exist in the database.");
		gifs.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("Your gif was successfully removed.");
	},
	link: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		if (!target.trim().toLowerCase().endsWith('.gif') && !target.trim().toLowerCase().endsWith('.jpg')) return this.say("Please provide an image or gif (url must end in .gif or .jpg)");
		let link = '<img src=' + target + ' width=50% height=40% />';
		this.sayHtml(link);
	},
	randgif: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let gifs = getDatabase(room.id).gifs;
		if (!gifs.length) return this.say("This room doesn't have any gifs.");
		let box = '<img src=' + Tools.sampleOne(gifs) + ' width=70% height=60% />';
		this.sayHtml(box);
	},
	gifs: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let gifs = database.gifs;
		if (!gifs.length) return this.say("This room doesn't have any gifs.");
		let prettifiedQuotes = "gifs for " + room.id + ":\n\n" + gifs.map(
			/**
			 * @param {string} gif
			 * @param {number} index
			 */
			(gif, index) => (index + 1) + ": " + gif
		).join("\n");
		Tools.uploadToHastebin(prettifiedQuotes, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.say("gifs: " + hastebinUrl);
		});
	},
	bop: function (target, room, user) {
		if (room instanceof Users.User || !canBop(user, room)) return this.say("Git good you have to be @ or dev to ~~ab00se~~ bop users");
		if (!target) return this.say("``.bop user`` to bop");
		this.say("/mute " + target + ",bap");
		this.say("/hidetext " + target);
		this.say("/unmute " + target);
		if (Tools.toId(target) === 'bapbot') 
		{
			this.say("/mute" + user + ",bap"); 
			this.say("/hidetext " + user);
			this.say("/unmute" + user);
		}
	},
	//Tour Commands
	pov: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '@')) return;
		this.say("/tour new gen7uu,elim");
		this.say("/tour rules -aggron-mega, -moltres, -snorlax, -hidden power, -regenerator");
		this.say("/wall This is a Povertymons tour!");
	},
	'mspl': 'sheddy',
	sheddy: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '@')) return;
		this.say("/tour new [Gen 6] Triples Custom Game, elim");
		this.say("/tour rules -Abomasnow, -Abra, -Absol, -Accelgor, -Aegislash, -Aerodactyl, -Aggron, -Aipom, -Alakazam, -Alomomola, -Altaria, -Amaura, -Ambipom, -Amoonguss, -Ampharos, -Anorith, -Araquanid, -Arbok, -Arcanine, -Arceus, -Archen, -Archeops, -Ariados, -Armaldo, -Aromatisse, -Aron, -Articuno, -Audino, -Aurorus, -Avalugg, -Axew, -Azelf, -Azumarill, -Azurill, -Bagon, -Baltoy, -Banette, -Barbaracle, -Barboach, -Basculin, -Bastiodon, -Bayleef, -Beartic, -Beautifly, -Beedrill, -Beheeyem, -Bellossom, -Bellsprout, -Bergmite, -Bewear, -Bibarel, -Bidoof, -Binacle, -Bisharp, -Blacephalon, -Blastoise, -Blaziken, -Blissey, -Blitzle, -Boldore, -Bonsly, -Bouffalant, -Bounsweet, -Braixen, -Braviary, -Breloom, -Brionne, -Bronzong, -Bronzor, -Bruxish, -Budew, -Buizel, -Bulbasaur, -Buneary, -Bunnelby, -Burmy, -Butterfree, -Buzzwole, -Cacnea, -Cacturne, -Camerupt, -Carbink, -Carnivine, -Carracosta, -Carvanha, -Castform, -Celebi, -Celesteela, -Chandelure, -Chansey, -Charizard, -Charjabug, -Charmander, -Charmeleon, -Chatot, -Cherrim, -Cherubi, -Chesnaught, -Chespin, -Chikorita, -Chimchar, -Chimecho, -Chinchou, -Chingling, -Cinccino, -Clamperl, -Clauncher, -Clawitzer, -Claydol, -Clefable, -Clefairy, -Cleffa, -Cloyster, -Cobalion, -Cofagrigus, -Combusken, -Comfey, -Conkeldurr, -Corphish, -Corsola, -Cottonee, -Crabominable, -Crabrawler, -Cradily, -Cranidos, -Crawdaunt, -Cresselia, -Croagunk, -Crobat, -Croconaw, -Crustle, -Cryogonal, -Cubchoo, -Cubone, -Cutiefly, -Cyndaquil, -Darkrai, -Darmanitan, -Dartrix, -Darumaka, -Decidueye, -Dedenne, -Deerling, -Deino, -Delcatty, -Delibird, -Delphox, -Deoxys, -Dewgong, -Dewott, -Dewpider, -Dhelmise, -Dialga, -Diancie, -Diggersby, -Diglett, -Dodrio, -Doduo, -Donphan, -Doublade, -Dragalge, -Dragonair, -Dragonite, -Drampa, -Drapion, -Dratini, -Drifblim, -Drifloon, -Drilbur, -Drowzee, -Druddigon, -Ducklett, -Dugtrio, -Dunsparce, -Duosion, -Durant, -Dusclops, -Dusknoir, -Duskull, -Dustox, -Dwebble, -Eelektrik, -Eelektross, -Eevee, -Ekans, -Electabuzz, -Electivire, -Electrike, -Electrode, -Elekid, -Elgyem, -Emboar, -Emolga, -Empoleon, -Entei, -Escavalier, -Espeon, -Espurr, -Excadrill, -Exeggcute, -Exeggutor, -Exploud, -Farfetch'd, -Fearow, -Feebas, -Fennekin, -Feraligatr, -Ferroseed, -Ferrothorn, -Finneon, -Flaaffy, -Flabébé, -Flareon, -Fletchinder, -Fletchling, -Floatzel, -Floette, -Florges, -Flygon, -Fomantis, -Foongus, -Forretress, -Fraxure, -Frillish, -Froakie, -Frogadier, -Froslass, -Furfrou, -Furret, -Gabite, -Gallade, -Galvantula, -Garbodor, -Garchomp, -Gardevoir, -Gastly, -Gastrodon, -Genesect, -Gengar, -Geodude, -Gible, -Gigalith, -Girafarig, -Giratina, -Glaceon, -Glalie, -Glameow, -Gligar, -Gliscor, -Gloom, -Gogoat, -Golbat, -Goldeen, -Golduck, -Golem, -Golett, -Golisopod, -Golurk, -Goodra, -Goomy, -Gorebyss, -Gothita, -Gothitelle, -Gothorita, -Gourgeist, -Granbull, -Graveler, -Greninja, -Grimer, -Grotle, -Groudon, -Grovyle, -Growlithe, -Grubbin, -Grumpig, -Gulpin, -Gumshoos, -Gurdurr, -Guzzlord, -Gyarados, -Hakamo-o, -Happiny, -Hariyama, -Haunter, -Hawlucha, -Haxorus, -Heatmor, -Heatran, -Heliolisk, -Helioptile, -Heracross, -Herdier, -Hippopotas, -Hippowdon, -Hitmonchan, -Hitmonlee, -Hitmontop, -Ho-Oh, -Honchkrow, -Honedge, -Hoopa, -Hoothoot, -Hoppip, -Horsea, -Houndoom, -Houndour, -Huntail, -Hydreigon, -Hypno, -Igglybuff, -Illumise, -Incineroar, -Infernape, -Inkay, -Ivysaur, -Jangmo-o, -Jellicent, -Jigglypuff, -Jirachi, -Jolteon, -Joltik, -Jumpluff, -Jynx, -Kabuto, -Kabutops, -Kadabra, -Kangaskhan, -Karrablast, -Kartana, -Kecleon, -Keldeo, -Kingdra, -Kingler, -Kirlia, -Klang, -Klefki, -Klink, -Klinklang, -Koffing, -Komala, -Kommo-o, -Krabby, -Kricketune, -Krokorok, -Krookodile, -Kyogre, -Kyurem, -Lairon, -Lampent, -Landorus, -Lanturn, -Lapras, -Larvesta, -Larvitar, -Latias, -Latios, -Leafeon, -Leavanny, -Ledian, -Ledyba, -Lickilicky, -Lickitung, -Liepard, -Lileep, -Lilligant, -Lillipup, -Linoone, -Litleo, -Litten, -Litwick, -Lombre, -Lopunny, -Lotad, -Loudred, -Lucario, -Ludicolo, -Lugia, -Lumineon, -Lunala, -Lunatone, -Lurantis, -Luvdisc, -Luxio, -Luxray, -Lycanroc, -Machamp, -Machoke, -Machop, -Magby, -Magcargo, -Magearna, -Magmar, -Magmortar, -Magnemite, -Magneton, -Magnezone, -Makuhita, -Malamar, -Mamoswine, -Manaphy, -Mandibuzz, -Manectric, -Mankey, -Mantine, -Mantyke, -Maractus, -Mareanie, -Mareep, -Marill, -Marowak, -Marshadow, -Marshtomp, -Masquerain, -Mawile, -Medicham, -Meditite, -Meganium, -Meloetta, -Meowstic, -Meowth, -Mesprit, -Metagross, -Metang, -Mew, -Mewtwo, -Mienfoo, -Mienshao, -Mightyena, -Milotic, -Miltank, -Mime Jr., -Mimikyu, -Minccino, -Minior, -Minun, -Misdreavus, -Mismagius, -Moltres, -Monferno, -Morelull, -Mothim, -Mr. Mime, -Mudbray, -Mudkip, -Mudsdale, -Muk, -Munchlax, -Munna, -Murkrow, -Musharna, -Naganadel, -Natu, -Necrozma, -Nidoking, -Nidoqueen, -Nidoran-F, -Nidoran-M, -Nidorina, -Nidorino, -Nihilego, -Nincada, -Ninetales, -Ninjask, -Noctowl, -Noibat, -Noivern, -Nosepass, -Numel, -Nuzleaf, -Octillery, -Oddish, -Omanyte, -Omastar, -Onix, -Oranguru, -Oricorio, -Oshawott, -Pachirisu, -Palkia, -Palossand, -Palpitoad, -Pancham, -Pangoro, -Panpour, -Pansage, -Pansear, -Paras, -Parasect, -Passimian, -Patrat, -Pawniard, -Pelipper, -Persian, -Petilil, -Phanpy, -Phantump, -Pheromosa, -Phione, -Pichu, -Pidgeot, -Pidgeotto, -Pidgey, -Pidove, -Pignite, -Pikachu, -Pikipek, -Piloswine, -Pineco, -Pinsir, -Piplup, -Plusle, -Poipole, -Politoed, -Poliwag, -Poliwhirl, -Poliwrath, -Ponyta, -Poochyena, -Popplio, -Porygon, -Porygon-Z, -Porygon2, -Primarina, -Primeape, -Prinplup, -Probopass, -Psyduck, -Pumpkaboo, -Pupitar, -Purrloin, -Purugly, -Pyroar, -Pyukumuku, -Quagsire, -Quilava, -Quilladin, -Qwilfish, -Raichu, -Raikou, -Ralts, -Rampardos, -Rapidash, -Raticate, -Rattata, -Rayquaza, -Regice, -Regirock, -Registeel, -Relicanth, -Remoraid, -Reshiram, -Reuniclus, -Rhydon, -Rhyhorn, -Rhyperior, -Ribombee, -Riolu, -Rockruff, -Roggenrola, -Roselia, -Roserade, -Rotom, -Rowlet, -Rufflet, -Sableye, -Salamence, -Salandit, -Salazzle, -Samurott, -Sandile, -Sandshrew, -Sandslash, -Sandygast, -Sawk, -Sawsbuck, -Sceptile, -Scizor, -Scolipede, -Scrafty, -Scraggy, -Scyther, -Seadra, -Seaking, -Sealeo, -Seedot, -Seel, -Seismitoad, -Sentret, -Serperior, -Servine, -Seviper, -Sewaddle, -Sharpedo, -Shaymin, -Shelgon, -Shellder, -Shellos, -Shelmet, -Shieldon, -Shiftry, -Shiinotic, -Shinx, -Shroomish, -Shuckle, -Shuppet, -Sigilyph, -Silvally, -Simipour, -Simisage, -Simisear, -Skarmory, -Skiddo, -Skiploom, -Skitty, -Skorupi, -Skrelp, -Skuntank, -Slaking, -Slakoth, -Sliggoo, -Slowbro, -Slowking, -Slowpoke, -Slugma, -Slurpuff, -Smeargle, -Smoochum, -Sneasel, -Snivy, -Snorlax, -Snorunt, -Snover, -Snubbull, -Solgaleo, -Solosis, -Solrock, -Spearow, -Spewpa, -Spheal, -Spinarak, -Spinda, -Spiritomb, -Spoink, -Spritzee, -Squirtle, -Stakataka, -Stantler, -Staraptor, -Staravia, -Starly, -Starmie, -Staryu, -Steelix, -Steenee, -Stoutland, -Stufful, -Stunfisk, -Stunky, -Sudowoodo, -Suicune, -Sunflora, -Sunkern, -Surskit, -Swablu, -Swadloon, -Swalot, -Swampert, -Swanna, -Swellow, -Swinub, -Swirlix, -Swoobat, -Sylveon, -Taillow, -Talonflame, -Tangela, -Tangrowth, -Tapu Bulu, -Tapu Fini, -Tapu Koko, -Tapu Lele, -Tauros, -Teddiursa, -Tentacool, -Tentacruel, -Tepig, -Terrakion, -Throh, -Thundurus, -Timburr, -Tirtouga, -Togedemaru, -Togekiss, -Togepi, -Togetic, -Torchic, -Torkoal, -Tornadus, -Torracat, -Torterra, -Totodile, -Toucannon, -Toxapex, -Toxicroak, -Tranquill, -Trapinch, -Treecko, -Trevenant, -Tropius, -Trubbish, -Trumbeak, -Tsareena, -Turtonator, -Turtwig, -Tympole, -Type: Null, -Typhlosion, -Tyranitar, -Tyrantrum, -Tyrogue, -Tyrunt, -Umbreon, -Unfezant, -Ursaring, -Uxie, -Vanillish, -Vanillite, -Vanilluxe, -Vaporeon, -Venipede, -Venomoth, -Venonat, -Venusaur, -Vespiquen, -Vibrava, -Victini, -Victreebel, -Vigoroth, -Vikavolt, -Vileplume, -Virizion, -Vivillon, -Volbeat, -Volcanion, -Volcarona, -Voltorb, -Vullaby, -Vulpix, -Wailmer, -Wailord, -Walrein, -Wartortle, -Watchog, -Weavile, -Weepinbell, -Weezing, -Whimsicott, -Whirlipede, -Whiscash, -Whismur, -Wigglytuff, -Wimpod, -Wingull, -Wishiwashi, -Woobat, -Wooper, -Wormadam, -Xatu, -Xerneas, -Xurkitree, -Yamask, -Yanma, -Yanmega, -Yungoos, -Yveltal, -Zangoose, -Zapdos, -Zebstrika, -Zekrom, -Zigzagoon, -Zoroark, -Zorua, -Zubat, -Zweilous, -Zygarde, -Beldum, -Cascoon, -Caterpie, -Combee, -Cosmoem, -Cosmog, -Ditto, -Kakuna, -Kricketot, -Magikarp, -Metapod, -Regigigas, -Scatterbug, -Silcoon, -Tynamo, -Unown, -Weedle, -Wobbuffet, -Wurmple, -Wynaut, -Absorb, -Accelerock, -Acid, -Acid Armor, -Acid Downpour, -Acid Spray, -Acrobatics, -Aerial Ace, -Aeroblast, -Agility, -Air Cutter, -Air Slash, -All-Out Pummeling, -Ally Switch, -Amnesia, -Anchor Shot, -Ancient Power, -Aqua Jet, -Aqua Ring, -Aqua Tail, -Arm Thrust, -Aromatherapy, -Aromatic Mist, -Assurance, -Astonish, -Attack Order, -Aura Sphere, -Aurora Beam, -Aurora Veil, -Autotomize, -Avalanche, -Baby-Doll Eyes, -Baneful Bunker, -Barrier, -Beak Blast, -Beat Up, -Belch, -Bite, -Black Hole Eclipse, -Blast Burn, -Blaze Kick, -Blizzard, -Bloom Doom, -Blue Flare, -Bolt Strike, -Bone Club, -Bone Rush, -Bonemerang, -Bounce, -Brave Bird, -Brick Break, -Brine, -Brutal Swing, -Bubble, -Bubble Beam, -Bug Bite, -Bug Buzz, -Bulk Up, -Bulldoze, -Bullet Punch, -Bullet Seed, -Burn Up, -Calm Mind, -Catastropika, -Charge, -Charge Beam, -Charm, -Chatter, -Circle Throw, -Clamp, -Clanging Scales, -Clangorous Soulblaze, -Clear Smog, -Close Combat, -Coil, -Confuse Ray, -Confusion, -Continental Crush, -Core Enforcer, -Corkscrew Crash, -Cosmic Power, -Cotton Guard, -Cotton Spore, -Counter, -Crabhammer, -Crafty Shield, -Cross Chop, -Cross Poison, -Crunch, -Curse, -Dark Pulse, -Dark Void, -Darkest Lariat, -Dazzling Gleam, -Defend Order, -Defog, -Destiny Bond, -Detect, -Devastating Drake, -Diamond Storm, -Dig, -Disarming Voice, -Discharge, -Dive, -Doom Desire, -Double Kick, -Draco Meteor, -Dragon Ascent, -Dragon Breath, -Dragon Claw, -Dragon Dance, -Dragon Hammer, -Dragon Pulse, -Dragon Rage, -Dragon Rush, -Dragon Tail, -Drain Punch, -Draining Kiss, -Dream Eater, -Drill Peck, -Drill Run, -Dual Chop, -Dynamic Punch, -Earth Power, -Earthquake, -Eerie Impulse, -Electric Terrain, -Electrify, -Electro Ball, -Electroweb, -Embargo, -Ember, -Energy Ball, -Eruption, -Extrasensory, -Fairy Lock, -Fairy Wind, -Fake Tears, -Feather Dance, -Feint Attack, -Fell Stinger, -Fiery Dance, -Final Gambit, -Fire Blast, -Fire Fang, -Fire Lash, -Fire Pledge, -Fire Punch, -Fire Spin, -First Impression, -Fissure, -Flame Burst, -Flame Charge, -Flame Wheel, -Flamethrower, -Flare Blitz, -Flash Cannon, -Flatter, -Fleur Cannon, -Fling, -Floral Healing, -Flower Shield, -Fly, -Flying Press, -Focus Blast, -Focus Punch, -Force Palm, -Forest's Curse, -Foul Play, -Freeze Shock, -Freeze-Dry, -Frenzy Plant, -Frost Breath, -Fury Cutter, -Fusion Bolt, -Fusion Flare, -Future Sight, -Gastro Acid, -Gear Grind, -Gear Up, -Genesis Supernova, -Geomancy, -Giga Drain, -Gigavolt Havoc, -Glaciate, -Grass Knot, -Grass Pledge, -Grass Whistle, -Grassy Terrain, -Gravity, -Grudge, -Guard Split, -Guard Swap, -Guardian of Alola, -Gunk Shot, -Gust, -Gyro Ball, -Hail, -Hammer Arm, -Haze, -Head Smash, -Heal Block, -Heal Order, -Heal Pulse, -Healing Wish, -Heart Stamp, -Heart Swap, -Heat Crash, -Heat Wave, -Heavy Slam, -Hex, -Hidden Power Bug, -Hidden Power Dark, -Hidden Power Dragon, -Hidden Power Electric, -Hidden Power Fighting, -Hidden Power Fire, -Hidden Power Flying, -Hidden Power Ghost, -Hidden Power Grass, -Hidden Power Ground, -Hidden Power Ice, -Hidden Power Poison, -Hidden Power Psychic, -Hidden Power Rock, -Hidden Power Steel, -Hidden Power Water, -High Horsepower, -High Jump Kick, -Hone Claws, -Horn Leech, -Hurricane, -Hydro Cannon, -Hydro Pump, -Hydro Vortex, -Hyperspace Fury, -Hyperspace Hole, -Hypnosis, -Ice Ball, -Ice Beam, -Ice Burn, -Ice Fang, -Ice Hammer, -Ice Punch, -Ice Shard, -Icicle Crash, -Icicle Spear, -Icy Wind, -Imprison, -Incinerate, -Inferno, -Inferno Overdrive, -Infestation, -Ingrain, -Instruct, -Ion Deluge, -Iron Defense, -Iron Head, -Iron Tail, -Jump Kick, -Karate Chop, -Kinesis, -King's Shield, -Knock Off, -Land's Wrath, -Lava Plume, -Leaf Blade, -Leaf Storm, -Leaf Tornado, -Leafage, -Leech Life, -Leech Seed, -Let's Snuggle Forever, -Lick, -Light Screen, -Light That Burns the Sky, -Light of Ruin, -Liquidation, -Low Kick, -Low Sweep, -Lunar Dance, -Lunge, -Luster Purge, -Mach Punch, -Magic Coat, -Magic Room, -Magical Leaf, -Magma Storm, -Magnet Bomb, -Magnet Rise, -Magnetic Flux, -Magnitude, -Malicious Moonsault, -Mat Block, -Meditate, -Mega Drain, -Megahorn, -Memento, -Menacing Moonraze Maelstrom, -Metal Burst, -Metal Claw, -Metal Sound, -Meteor Mash, -Mind Blown, -Miracle Eye, -Mirror Coat, -Mirror Move, -Mirror Shot, -Mist, -Mist Ball, -Misty Terrain, -Moonblast, -Moongeist Beam, -Moonlight, -Mud Bomb, -Mud Shot, -Mud Sport, -Mud-Slap, -Muddy Water, -Mystical Fire, -Nasty Plot, -Nature's Madness, -Needle Arm, -Never-Ending Nightmare, -Night Daze, -Night Shade, -Night Slash, -Nightmare, -Nuzzle, -Oblivion Wing, -Oceanic Operetta, -Octazooka, -Ominous Wind, -Origin Pulse, -Outrage, -Overheat, -Paleo Wave, -Parabolic Charge, -Parting Shot, -Payback, -Peck, -Petal Blizzard, -Petal Dance, -Phantom Force, -Photon Geyser, -Pin Missile, -Plasma Fists, -Play Rough, -Pluck, -Poison Fang, -Poison Gas, -Poison Jab, -Poison Powder, -Poison Sting, -Poison Tail, -Pollen Puff, -Powder, -Powder Snow, -Power Gem, -Power Split, -Power Swap, -Power Trick, -Power Trip, -Power Whip, -Power-Up Punch, -Precipice Blades, -Prismatic Laser, -Psybeam, -Psychic, -Psychic Fangs, -Psychic Terrain, -Psycho Boost, -Psycho Cut, -Psycho Shift, -Psyshock, -Psystrike, -Psywave, -Punishment, -Purify, -Pursuit, -Quash, -Quick Guard, -Quiver Dance, -Rage Powder, -Rain Dance, -Razor Leaf, -Razor Shell, -Reflect, -Rest, -Revenge, -Reversal, -Roar of Time, -Rock Blast, -Rock Polish, -Rock Slide, -Rock Smash, -Rock Throw, -Rock Tomb, -Rock Wrecker, -Role Play, -Rolling Kick, -Rollout, -Roost, -Rototiller, -Sacred Fire, -Sacred Sword, -Sand Attack, -Sand Tomb, -Sandstorm, -Savage Spin-Out, -Scald, -Searing Shot, -Searing Sunraze Smash, -Secret Sword, -Seed Bomb, -Seed Flare, -Seismic Toss, -Shadow Ball, -Shadow Bone, -Shadow Claw, -Shadow Force, -Shadow Punch, -Shadow Sneak, -Shadow Strike, -Shattered Psyche, -Sheer Cold, -Shell Trap, -Shift Gear, -Shock Wave, -Shore Up, -Signal Beam, -Silver Wind, -Sinister Arrow Raid, -Skill Swap, -Sky Attack, -Sky Drop, -Sky Uppercut, -Sleep Powder, -Sludge, -Sludge Bomb, -Sludge Wave, -Smack Down, -Smart Strike, -Smog, -Snarl, -Snatch, -Soak, -Solar Beam, -Solar Blade, -Soul-Stealing 7-Star Strike, -Spacial Rend, -Spark, -Sparkling Aria, -Spectral Thief, -Speed Swap, -Spider Web, -Spikes, -Spiky Shield, -Spirit Shackle, -Spite, -Splintered Stormshards, -Spore, -Stealth Rock, -Steam Eruption, -Steamroller, -Steel Wing, -Sticky Web, -Stoked Sparksurfer, -Stomping Tantrum, -Stone Edge, -Stored Power, -Storm Throw, -Strength Sap, -String Shot, -Struggle Bug, -Stun Spore, -Submission, -Subzero Slammer, -Sucker Punch, -Sunny Day, -Sunsteel Strike, -Superpower, -Supersonic Skystrike, -Surf, -Sweet Kiss, -Switcheroo, -Synchronoise, -Synthesis, -Tail Glow, -Tailwind, -Taunt, -Tectonic Rage, -Telekinesis, -Teleport, -Thief, -Thousand Arrows, -Thousand Waves, -Throat Chop, -Thunder, -Thunder Fang, -Thunder Punch, -Thunder Shock, -Thunder Wave, -Thunderbolt, -Topsy-Turvy, -Torment, -Toxic, -Toxic Spikes, -Toxic Thread, -Trick, -Trick Room, -Trick-or-Treat, -Triple Kick, -Trop Kick, -Twineedle, -Twinkle Tackle, -Twister, -U-turn, -V-create, -Vacuum Wave, -Venom Drench, -Venoshock, -Vine Whip, -Vital Throw, -Volt Switch, -Volt Tackle, -Wake-Up Slap, -Water Gun, -Water Pledge, -Water Pulse, -Water Shuriken, -Water Sport, -Water Spout, -Waterfall, -Whirlpool, -Wide Guard, -Wild Charge, -Will-O-Wisp, -Wing Attack, -Withdraw, -Wonder Room, -Wood Hammer, -Worry Seed, -X-Scissor, -Zap Cannon, -Zen Headbutt, -Zing Zap, -Acupressure, -After You, -Assist, -Attract, -Barrage, -Baton Pass, -Belly Drum, -Bestow, -Bide, -Bind, -Block, -Body Slam, -Boomburst, -Breakneck Blitz, -Camouflage, -Captivate, -Celebrate, -Chip Away, -Comet Punch, -Confide, -Constrict, -Conversion, -Conversion 2, -Copycat, -Covet, -Crush Claw, -Crush Grip, -Cut, -Defense Curl, -Disable, -Dizzy Punch, -Double Hit, -Double Slap, -Double Team, -Double-Edge, -Echoed Voice, -Egg Bomb, -Encore, -Endeavor, -Endure, -Entrainment, -Explosion, -Extreme Evoboost, -Extreme Speed, -Facade, -Fake Out, -False Swipe, -Feint, -Flail, -Flash, -Focus Energy, -Follow Me, -Foresight, -Frustration, -Fury Attack, -Fury Swipes, -Giga Impact, -Glare, -Growl, -Growth, -Guillotine, -Happy Hour, -Harden, -Head Charge, -Headbutt, -Heal Bell, -Helping Hand, -Hidden Power, -Hold Back, -Hold Hands, -Horn Attack, -Horn Drill, -Howl, -Hyper Beam, -Hyper Fang, -Hyper Voice, -Judgment, -Laser Focus, -Last Resort, -Leer, -Lock-On, -Lovely Kiss, -Lucky Chant, -Me First, -Mean Look, -Mega Kick, -Mega Punch, -Milk Drink, -Mimic, -Mind Reader, -Minimize, -Morning Sun, -Multi-Attack, -Natural Gift, -Nature Power, -Noble Roar, -Odor Sleuth, -Pain Split, -Pay Day, -Perish Song, -Play Nice, -Pound, -Present, -Protect, -Psych Up, -Pulverizing Pancake, -Quick Attack, -Rage, -Rapid Spin, -Razor Wind, -Recover, -Recycle, -Reflect Type, -Refresh, -Relic Song, -Retaliate, -Return, -Revelation Dance, -Roar, -Rock Climb, -Round, -Safeguard, -Scary Face, -Scratch, -Screech, -Secret Power, -Self-Destruct, -Sharpen, -Shell Smash, -Simple Beam, -Sing, -Sketch, -Skull Bash, -Slack Off, -Slam, -Slash, -Sleep Talk, -Smelling Salts, -Smokescreen, -Snore, -Soft-Boiled, -Sonic Boom, -Spike Cannon, -Spit Up, -Splash, -Spotlight, -Stockpile, -Stomp, -Strength, -Struggle, -Substitute, -Super Fang, -Supersonic, -Swagger, -Swallow, -Sweet Scent, -Swift, -Swords Dance, -Tackle, -Tail Slap, -Tail Whip, -Take Down, -Tearful Look, -Techno Blast, -Teeter Dance, -Thrash, -Tickle, -Transform, -Tri Attack, -Trump Card, -Uproar, -Vice Grip, -Weather Ball, -Whirlwind, -Wish, -Work Up, -Wrap, -Wring Out, -Yawn, -Focus Sash, -Sturdy, inversemod");
		this.say("/wall This is a Sheddy tour!");
		this.say("/tour name MSPL");
	},
	// General commands
	'code':'git', 'bapcode':'git',
	git: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say("Bapcode: https://github.com/wuhoodude/Bapbot");
	},
};

exports.commands = commands;
