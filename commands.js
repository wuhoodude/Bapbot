/**
 * Commands
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the base commands for Cassius.
 *
 * @license MIT license
 */

'use strict';

// Users who use the settour command when a tournament is already
// scheduled will be added here and prompted to reuse the command.
// This prevents accidentally overwriting a scheduled tournament.
/**@type {Map<string, string>} */
let overwriteWarnings = new Map();

/**@type {{[k: string]: Command | string}} */
let commands = {
	// Developer commands
	js: 'eval',
	eval: function (target, room, user) {
		if (!user.isDeveloper()) return;
		try {
			target = eval(target);
			this.say(JSON.stringify(target));
		} catch (e) {
			this.say(e.name + ": " + e.message);
		}
	},

	// UNO commands
	uno: function (target, room, user) {
		if (!target) return this.say('/uno create');
	},
	unostart: function (target, room, user) {
		if (!target) return this.say('/uno start');
	},
	unoend: function (target, room, user) {
		 if (!target) return this.say('/uno end');
	},
	
	unohelp: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say("To create: ``.uno`` To start: ``.unostart`` To end: ``.unoend``");
	},
	//General Commands
	about: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say(Config.username + " code by sirDonovan: https://github.com/sirDonovan/Cassius");
	},
	help: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (!Config.guide) return this.say("There is no guide available.");
		this.say(Users.self.name + " guide: " + Config.guide);
	},
	mail: function (target, room, user) {
		if (!(room instanceof Users.User) || !Config.allowMail) return;
		let targets = target.split(',');
		if (targets.length < 2) return this.say("Please use the following format: .mail user, message");
		let to = Tools.toId(targets[0]);
		if (!to || to.length > 18 || to === Users.self.id || to.startsWith('guest')) return this.say("Please enter a valid username");
		let message = targets.slice(1).join(',').trim();
		let id = Tools.toId(message);
		if (!id) return this.say("Please include a message to send.");
		if (message.length > (258 - user.name.length)) return this.say("Your message is too long.");
		let database = Storage.getDatabase('global');
		if (to in database.mail) {
			let queued = 0;
			for (let i = 0, len = database.mail[to].length; i < len; i++) {
				if (Tools.toId(database.mail[to][i].from) === user.id) queued++;
			}
			if (queued >= 3) return this.say("You have too many messages queued for " + Users.add(targets[0]).name + ".");
		} else {
			database.mail[to] = [];
		}
		database.mail[to].push({time: Date.now(), from: user.name, text: message});
		Storage.exportDatabase('global');
		this.say("Your message has been sent to " + Users.add(targets[0]).name + "!");
	},

	// Game commands
	
	game: function (target, room, user) {
		if (room instanceof Users.User) return;
		if (!user.hasRank(room, '+')) return;
		if (!Config.games || !Config.games.includes(room.id)) return this.say("~~Supreme Leader~~ #Cam.: I mean I may be a buzzkill but i just don't want bot games going on");
		let format = Games.getFormat(target);
		if (!format || format.inheritOnly) return this.say("The game '" + target + "' was not found.");
		if (format.internal) return this.say(format.name + " cannot be started manually.");
		Games.createGame(format, room);
		if (!room.game) return;
		room.game.signups();
	},
	start: 'startgame',
	startgame: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (room.game) room.game.start();
	},
	cap: 'capgame',
	capgame: function (target, room, user) {
		if (room instanceof Users.User || !room.game || !user.hasRank(room, '+')) return;
		let cap = parseInt(target);
		if (isNaN(cap)) return this.say("Please enter a valid player cap.");
		if (cap < room.game.minPlayers) return this.say(room.game.name + " must have at least " + room.game.minPlayers + " players.");
		if (room.game.maxPlayers && cap > room.game.maxPlayers) return this.say(room.game.name + " cannot have more than " + room.game.maxPlayers + " players.");
		room.game.playerCap = cap;
		this.say("The game will automatically start at **" + cap + "** players!");
	},
	end: 'endgame',
	endgame: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (room.game) room.game.forceEnd();
	},
	join: 'joingame',
	joingame: function (target, room, user) {
		if (room instanceof Users.User || !room.game) return;
		room.game.join(user);
	},
	leave: 'leavegame',
	leavegame: function (target, room, user) {
		if (room instanceof Users.User || !room.game) return;
		room.game.leave(user);
	},

	// Storage commands
	bits: 'points',
	points: function (target, room, user) {
		if (room !== user) return;
		let targetUserid = target ? Tools.toId(target) : user.id;
		/**@type {Array<string>} */
		let points = [];
		user.rooms.forEach((rank, room) => {
			if (!(room.id in Storage.databases) || !('leaderboard' in Storage.databases[room.id])) return;
			if (targetUserid in Storage.databases[room.id].leaderboard) points.push("**" + room.id + "**: " + Storage.databases[room.id].leaderboard[targetUserid].points);
		});
		if (!points.length) return this.say((target ? target.trim() + " does not" : "You do not") + " have points on any leaderboard.");
		this.say(points.join(" | "));
	},

	// Tournament commands
	tour: 'tournament',
	tournament: function (target, room, user) {
		if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id)) return;
		if (!target) {
			if (!user.hasRank(room, '+')) return;
			if (!room.tour) return this.say("I am not currently tracking a tournament in this room.");
			let info = "``" + room.tour.name + " tournament info``";
			if (room.tour.startTime) {
				return this.say(info + ": **Time**: " + Tools.toDurationString(Date.now() - room.tour.startTime) + " | **Remaining players**: " + room.tour.getRemainingPlayerCount() + '/' + room.tour.totalPlayers);
			} else if (room.tour.started) {
				return this.say(info + ": **Remaining players**: " + room.tour.getRemainingPlayerCount() + '/' + room.tour.totalPlayers);
			} else {
				return this.say(info + ": " + room.tour.playerCount + " player" + (room.tour.playerCount > 1 ? "s" : ""));
			}
		} else {
			if (!user.hasRank(room, '%')) return;
			let targets = target.split(',');
			let cmd = Tools.toId(targets[0]);
			let format;
			switch (cmd) {
			case 'end':
				this.say("/tour end");
				break;
			case 'start':
				this.say("/tour start");
				break;
			case 'pov':
				this.say("/tour new gen7uu,elim");
				this.say("/tour rules -aggron-mega, -moltres, -snorlax, -hidden power, -regenerator");
				this.say("/tour rules autostart 1");
				this.say("/wall This is a Povertymons tour!");
				break;
			case 'mspl':
				this.say("/tour new [Gen 6] Triples Custom Game, elim");
				this.say("/tour rules -Abomasnow, -Abra, -Absol, -Accelgor, -Aegislash, -Aerodactyl, -Aggron, -Aipom, -Alakazam, -Alomomola, -Altaria, -Amaura, -Ambipom, -Amoonguss, -Ampharos, -Anorith, -Araquanid, -Arbok, -Arcanine, -Arceus, -Archen, -Archeops, -Ariados, -Armaldo, -Aromatisse, -Aron, -Articuno, -Audino, -Aurorus, -Avalugg, -Axew, -Azelf, -Azumarill, -Azurill, -Bagon, -Baltoy, -Banette, -Barbaracle, -Barboach, -Basculin, -Bastiodon, -Bayleef, -Beartic, -Beautifly, -Beedrill, -Beheeyem, -Bellossom, -Bellsprout, -Bergmite, -Bewear, -Bibarel, -Bidoof, -Binacle, -Bisharp, -Blacephalon, -Blastoise, -Blaziken, -Blissey, -Blitzle, -Boldore, -Bonsly, -Bouffalant, -Bounsweet, -Braixen, -Braviary, -Breloom, -Brionne, -Bronzong, -Bronzor, -Bruxish, -Budew, -Buizel, -Bulbasaur, -Buneary, -Bunnelby, -Burmy, -Butterfree, -Buzzwole, -Cacnea, -Cacturne, -Camerupt, -Carbink, -Carnivine, -Carracosta, -Carvanha, -Castform, -Celebi, -Celesteela, -Chandelure, -Chansey, -Charizard, -Charjabug, -Charmander, -Charmeleon, -Chatot, -Cherrim, -Cherubi, -Chesnaught, -Chespin, -Chikorita, -Chimchar, -Chimecho, -Chinchou, -Chingling, -Cinccino, -Clamperl, -Clauncher, -Clawitzer, -Claydol, -Clefable, -Clefairy, -Cleffa, -Cloyster, -Cobalion, -Cofagrigus, -Combusken, -Comfey, -Conkeldurr, -Corphish, -Corsola, -Cottonee, -Crabominable, -Crabrawler, -Cradily, -Cranidos, -Crawdaunt, -Cresselia, -Croagunk, -Crobat, -Croconaw, -Crustle, -Cryogonal, -Cubchoo, -Cubone, -Cutiefly, -Cyndaquil, -Darkrai, -Darmanitan, -Dartrix, -Darumaka, -Decidueye, -Dedenne, -Deerling, -Deino, -Delcatty, -Delibird, -Delphox, -Deoxys, -Dewgong, -Dewott, -Dewpider, -Dhelmise, -Dialga, -Diancie, -Diggersby, -Diglett, -Dodrio, -Doduo, -Donphan, -Doublade, -Dragalge, -Dragonair, -Dragonite, -Drampa, -Drapion, -Dratini, -Drifblim, -Drifloon, -Drilbur, -Drowzee, -Druddigon, -Ducklett, -Dugtrio, -Dunsparce, -Duosion, -Durant, -Dusclops, -Dusknoir, -Duskull, -Dustox, -Dwebble, -Eelektrik, -Eelektross, -Eevee, -Ekans, -Electabuzz, -Electivire, -Electrike, -Electrode, -Elekid, -Elgyem, -Emboar, -Emolga, -Empoleon, -Entei, -Escavalier, -Espeon, -Espurr, -Excadrill, -Exeggcute, -Exeggutor, -Exploud, -Farfetch'd, -Fearow, -Feebas, -Fennekin, -Feraligatr, -Ferroseed, -Ferrothorn, -Finneon, -Flaaffy, -Flabébé, -Flareon, -Fletchinder, -Fletchling, -Floatzel, -Floette, -Florges, -Flygon, -Fomantis, -Foongus, -Forretress, -Fraxure, -Frillish, -Froakie, -Frogadier, -Froslass, -Furfrou, -Furret, -Gabite, -Gallade, -Galvantula, -Garbodor, -Garchomp, -Gardevoir, -Gastly, -Gastrodon, -Genesect, -Gengar, -Geodude, -Gible, -Gigalith, -Girafarig, -Giratina, -Glaceon, -Glalie, -Glameow, -Gligar, -Gliscor, -Gloom, -Gogoat, -Golbat, -Goldeen, -Golduck, -Golem, -Golett, -Golisopod, -Golurk, -Goodra, -Goomy, -Gorebyss, -Gothita, -Gothitelle, -Gothorita, -Gourgeist, -Granbull, -Graveler, -Greninja, -Grimer, -Grotle, -Groudon, -Grovyle, -Growlithe, -Grubbin, -Grumpig, -Gulpin, -Gumshoos, -Gurdurr, -Guzzlord, -Gyarados, -Hakamo-o, -Happiny, -Hariyama, -Haunter, -Hawlucha, -Haxorus, -Heatmor, -Heatran, -Heliolisk, -Helioptile, -Heracross, -Herdier, -Hippopotas, -Hippowdon, -Hitmonchan, -Hitmonlee, -Hitmontop, -Ho-Oh, -Honchkrow, -Honedge, -Hoopa, -Hoothoot, -Hoppip, -Horsea, -Houndoom, -Houndour, -Huntail, -Hydreigon, -Hypno, -Igglybuff, -Illumise, -Incineroar, -Infernape, -Inkay, -Ivysaur, -Jangmo-o, -Jellicent, -Jigglypuff, -Jirachi, -Jolteon, -Joltik, -Jumpluff, -Jynx, -Kabuto, -Kabutops, -Kadabra, -Kangaskhan, -Karrablast, -Kartana, -Kecleon, -Keldeo, -Kingdra, -Kingler, -Kirlia, -Klang, -Klefki, -Klink, -Klinklang, -Koffing, -Komala, -Kommo-o, -Krabby, -Kricketune, -Krokorok, -Krookodile, -Kyogre, -Kyurem, -Lairon, -Lampent, -Landorus, -Lanturn, -Lapras, -Larvesta, -Larvitar, -Latias, -Latios, -Leafeon, -Leavanny, -Ledian, -Ledyba, -Lickilicky, -Lickitung, -Liepard, -Lileep, -Lilligant, -Lillipup, -Linoone, -Litleo, -Litten, -Litwick, -Lombre, -Lopunny, -Lotad, -Loudred, -Lucario, -Ludicolo, -Lugia, -Lumineon, -Lunala, -Lunatone, -Lurantis, -Luvdisc, -Luxio, -Luxray, -Lycanroc, -Machamp, -Machoke, -Machop, -Magby, -Magcargo, -Magearna, -Magmar, -Magmortar, -Magnemite, -Magneton, -Magnezone, -Makuhita, -Malamar, -Mamoswine, -Manaphy, -Mandibuzz, -Manectric, -Mankey, -Mantine, -Mantyke, -Maractus, -Mareanie, -Mareep, -Marill, -Marowak, -Marshadow, -Marshtomp, -Masquerain, -Mawile, -Medicham, -Meditite, -Meganium, -Meloetta, -Meowstic, -Meowth, -Mesprit, -Metagross, -Metang, -Mew, -Mewtwo, -Mienfoo, -Mienshao, -Mightyena, -Milotic, -Miltank, -Mime Jr., -Mimikyu, -Minccino, -Minior, -Minun, -Misdreavus, -Mismagius, -Moltres, -Monferno, -Morelull, -Mothim, -Mr. Mime, -Mudbray, -Mudkip, -Mudsdale, -Muk, -Munchlax, -Munna, -Murkrow, -Musharna, -Naganadel, -Natu, -Necrozma, -Nidoking, -Nidoqueen, -Nidoran-F, -Nidoran-M, -Nidorina, -Nidorino, -Nihilego, -Nincada, -Ninetales, -Ninjask, -Noctowl, -Noibat, -Noivern, -Nosepass, -Numel, -Nuzleaf, -Octillery, -Oddish, -Omanyte, -Omastar, -Onix, -Oranguru, -Oricorio, -Oshawott, -Pachirisu, -Palkia, -Palossand, -Palpitoad, -Pancham, -Pangoro, -Panpour, -Pansage, -Pansear, -Paras, -Parasect, -Passimian, -Patrat, -Pawniard, -Pelipper, -Persian, -Petilil, -Phanpy, -Phantump, -Pheromosa, -Phione, -Pichu, -Pidgeot, -Pidgeotto, -Pidgey, -Pidove, -Pignite, -Pikachu, -Pikipek, -Piloswine, -Pineco, -Pinsir, -Piplup, -Plusle, -Poipole, -Politoed, -Poliwag, -Poliwhirl, -Poliwrath, -Ponyta, -Poochyena, -Popplio, -Porygon, -Porygon-Z, -Porygon2, -Primarina, -Primeape, -Prinplup, -Probopass, -Psyduck, -Pumpkaboo, -Pupitar, -Purrloin, -Purugly, -Pyroar, -Pyukumuku, -Quagsire, -Quilava, -Quilladin, -Qwilfish, -Raichu, -Raikou, -Ralts, -Rampardos, -Rapidash, -Raticate, -Rattata, -Rayquaza, -Regice, -Regirock, -Registeel, -Relicanth, -Remoraid, -Reshiram, -Reuniclus, -Rhydon, -Rhyhorn, -Rhyperior, -Ribombee, -Riolu, -Rockruff, -Roggenrola, -Roselia, -Roserade, -Rotom, -Rowlet, -Rufflet, -Sableye, -Salamence, -Salandit, -Salazzle, -Samurott, -Sandile, -Sandshrew, -Sandslash, -Sandygast, -Sawk, -Sawsbuck, -Sceptile, -Scizor, -Scolipede, -Scrafty, -Scraggy, -Scyther, -Seadra, -Seaking, -Sealeo, -Seedot, -Seel, -Seismitoad, -Sentret, -Serperior, -Servine, -Seviper, -Sewaddle, -Sharpedo, -Shaymin, -Shelgon, -Shellder, -Shellos, -Shelmet, -Shieldon, -Shiftry, -Shiinotic, -Shinx, -Shroomish, -Shuckle, -Shuppet, -Sigilyph, -Silvally, -Simipour, -Simisage, -Simisear, -Skarmory, -Skiddo, -Skiploom, -Skitty, -Skorupi, -Skrelp, -Skuntank, -Slaking, -Slakoth, -Sliggoo, -Slowbro, -Slowking, -Slowpoke, -Slugma, -Slurpuff, -Smeargle, -Smoochum, -Sneasel, -Snivy, -Snorlax, -Snorunt, -Snover, -Snubbull, -Solgaleo, -Solosis, -Solrock, -Spearow, -Spewpa, -Spheal, -Spinarak, -Spinda, -Spiritomb, -Spoink, -Spritzee, -Squirtle, -Stakataka, -Stantler, -Staraptor, -Staravia, -Starly, -Starmie, -Staryu, -Steelix, -Steenee, -Stoutland, -Stufful, -Stunfisk, -Stunky, -Sudowoodo, -Suicune, -Sunflora, -Sunkern, -Surskit, -Swablu, -Swadloon, -Swalot, -Swampert, -Swanna, -Swellow, -Swinub, -Swirlix, -Swoobat, -Sylveon, -Taillow, -Talonflame, -Tangela, -Tangrowth, -Tapu Bulu, -Tapu Fini, -Tapu Koko, -Tapu Lele, -Tauros, -Teddiursa, -Tentacool, -Tentacruel, -Tepig, -Terrakion, -Throh, -Thundurus, -Timburr, -Tirtouga, -Togedemaru, -Togekiss, -Togepi, -Togetic, -Torchic, -Torkoal, -Tornadus, -Torracat, -Torterra, -Totodile, -Toucannon, -Toxapex, -Toxicroak, -Tranquill, -Trapinch, -Treecko, -Trevenant, -Tropius, -Trubbish, -Trumbeak, -Tsareena, -Turtonator, -Turtwig, -Tympole, -Type: Null, -Typhlosion, -Tyranitar, -Tyrantrum, -Tyrogue, -Tyrunt, -Umbreon, -Unfezant, -Ursaring, -Uxie, -Vanillish, -Vanillite, -Vanilluxe, -Vaporeon, -Venipede, -Venomoth, -Venonat, -Venusaur, -Vespiquen, -Vibrava, -Victini, -Victreebel, -Vigoroth, -Vikavolt, -Vileplume, -Virizion, -Vivillon, -Volbeat, -Volcanion, -Volcarona, -Voltorb, -Vullaby, -Vulpix, -Wailmer, -Wailord, -Walrein, -Wartortle, -Watchog, -Weavile, -Weepinbell, -Weezing, -Whimsicott, -Whirlipede, -Whiscash, -Whismur, -Wigglytuff, -Wimpod, -Wingull, -Wishiwashi, -Woobat, -Wooper, -Wormadam, -Xatu, -Xerneas, -Xurkitree, -Yamask, -Yanma, -Yanmega, -Yungoos, -Yveltal, -Zangoose, -Zapdos, -Zebstrika, -Zekrom, -Zigzagoon, -Zoroark, -Zorua, -Zubat, -Zweilous, -Zygarde, -Beldum, -Cascoon, -Caterpie, -Combee, -Cosmoem, -Cosmog, -Ditto, -Kakuna, -Kricketot, -Magikarp, -Metapod, -Regigigas, -Scatterbug, -Silcoon, -Tynamo, -Unown, -Weedle, -Wobbuffet, -Wurmple, -Wynaut, -Absorb, -Accelerock, -Acid, -Acid Armor, -Acid Downpour, -Acid Spray, -Acrobatics, -Aerial Ace, -Aeroblast, -Agility, -Air Cutter, -Air Slash, -All-Out Pummeling, -Ally Switch, -Amnesia, -Anchor Shot, -Ancient Power, -Aqua Jet, -Aqua Ring, -Aqua Tail, -Arm Thrust, -Aromatherapy, -Aromatic Mist, -Assurance, -Astonish, -Attack Order, -Aura Sphere, -Aurora Beam, -Aurora Veil, -Autotomize, -Avalanche, -Baby-Doll Eyes, -Baneful Bunker, -Barrier, -Beak Blast, -Beat Up, -Belch, -Bite, -Black Hole Eclipse, -Blast Burn, -Blaze Kick, -Blizzard, -Bloom Doom, -Blue Flare, -Bolt Strike, -Bone Club, -Bone Rush, -Bonemerang, -Bounce, -Brave Bird, -Brick Break, -Brine, -Brutal Swing, -Bubble, -Bubble Beam, -Bug Bite, -Bug Buzz, -Bulk Up, -Bulldoze, -Bullet Punch, -Bullet Seed, -Burn Up, -Calm Mind, -Catastropika, -Charge, -Charge Beam, -Charm, -Chatter, -Circle Throw, -Clamp, -Clanging Scales, -Clangorous Soulblaze, -Clear Smog, -Close Combat, -Coil, -Confuse Ray, -Confusion, -Continental Crush, -Core Enforcer, -Corkscrew Crash, -Cosmic Power, -Cotton Guard, -Cotton Spore, -Counter, -Crabhammer, -Crafty Shield, -Cross Chop, -Cross Poison, -Crunch, -Curse, -Dark Pulse, -Dark Void, -Darkest Lariat, -Dazzling Gleam, -Defend Order, -Defog, -Destiny Bond, -Detect, -Devastating Drake, -Diamond Storm, -Dig, -Disarming Voice, -Discharge, -Dive, -Doom Desire, -Double Kick, -Draco Meteor, -Dragon Ascent, -Dragon Breath, -Dragon Claw, -Dragon Dance, -Dragon Hammer, -Dragon Pulse, -Dragon Rage, -Dragon Rush, -Dragon Tail, -Drain Punch, -Draining Kiss, -Dream Eater, -Drill Peck, -Drill Run, -Dual Chop, -Dynamic Punch, -Earth Power, -Earthquake, -Eerie Impulse, -Electric Terrain, -Electrify, -Electro Ball, -Electroweb, -Embargo, -Ember, -Energy Ball, -Eruption, -Extrasensory, -Fairy Lock, -Fairy Wind, -Fake Tears, -Feather Dance, -Feint Attack, -Fell Stinger, -Fiery Dance, -Final Gambit, -Fire Blast, -Fire Fang, -Fire Lash, -Fire Pledge, -Fire Punch, -Fire Spin, -First Impression, -Fissure, -Flame Burst, -Flame Charge, -Flame Wheel, -Flamethrower, -Flare Blitz, -Flash Cannon, -Flatter, -Fleur Cannon, -Fling, -Floral Healing, -Flower Shield, -Fly, -Flying Press, -Focus Blast, -Focus Punch, -Force Palm, -Forest's Curse, -Foul Play, -Freeze Shock, -Freeze-Dry, -Frenzy Plant, -Frost Breath, -Fury Cutter, -Fusion Bolt, -Fusion Flare, -Future Sight, -Gastro Acid, -Gear Grind, -Gear Up, -Genesis Supernova, -Geomancy, -Giga Drain, -Gigavolt Havoc, -Glaciate, -Grass Knot, -Grass Pledge, -Grass Whistle, -Grassy Terrain, -Gravity, -Grudge, -Guard Split, -Guard Swap, -Guardian of Alola, -Gunk Shot, -Gust, -Gyro Ball, -Hail, -Hammer Arm, -Haze, -Head Smash, -Heal Block, -Heal Order, -Heal Pulse, -Healing Wish, -Heart Stamp, -Heart Swap, -Heat Crash, -Heat Wave, -Heavy Slam, -Hex, -Hidden Power Bug, -Hidden Power Dark, -Hidden Power Dragon, -Hidden Power Electric, -Hidden Power Fighting, -Hidden Power Fire, -Hidden Power Flying, -Hidden Power Ghost, -Hidden Power Grass, -Hidden Power Ground, -Hidden Power Ice, -Hidden Power Poison, -Hidden Power Psychic, -Hidden Power Rock, -Hidden Power Steel, -Hidden Power Water, -High Horsepower, -High Jump Kick, -Hone Claws, -Horn Leech, -Hurricane, -Hydro Cannon, -Hydro Pump, -Hydro Vortex, -Hyperspace Fury, -Hyperspace Hole, -Hypnosis, -Ice Ball, -Ice Beam, -Ice Burn, -Ice Fang, -Ice Hammer, -Ice Punch, -Ice Shard, -Icicle Crash, -Icicle Spear, -Icy Wind, -Imprison, -Incinerate, -Inferno, -Inferno Overdrive, -Infestation, -Ingrain, -Instruct, -Ion Deluge, -Iron Defense, -Iron Head, -Iron Tail, -Jump Kick, -Karate Chop, -Kinesis, -King's Shield, -Knock Off, -Land's Wrath, -Lava Plume, -Leaf Blade, -Leaf Storm, -Leaf Tornado, -Leafage, -Leech Life, -Leech Seed, -Let's Snuggle Forever, -Lick, -Light Screen, -Light That Burns the Sky, -Light of Ruin, -Liquidation, -Low Kick, -Low Sweep, -Lunar Dance, -Lunge, -Luster Purge, -Mach Punch, -Magic Coat, -Magic Room, -Magical Leaf, -Magma Storm, -Magnet Bomb, -Magnet Rise, -Magnetic Flux, -Magnitude, -Malicious Moonsault, -Mat Block, -Meditate, -Mega Drain, -Megahorn, -Memento, -Menacing Moonraze Maelstrom, -Metal Burst, -Metal Claw, -Metal Sound, -Meteor Mash, -Mind Blown, -Miracle Eye, -Mirror Coat, -Mirror Move, -Mirror Shot, -Mist, -Mist Ball, -Misty Terrain, -Moonblast, -Moongeist Beam, -Moonlight, -Mud Bomb, -Mud Shot, -Mud Sport, -Mud-Slap, -Muddy Water, -Mystical Fire, -Nasty Plot, -Nature's Madness, -Needle Arm, -Never-Ending Nightmare, -Night Daze, -Night Shade, -Night Slash, -Nightmare, -Nuzzle, -Oblivion Wing, -Oceanic Operetta, -Octazooka, -Ominous Wind, -Origin Pulse, -Outrage, -Overheat, -Paleo Wave, -Parabolic Charge, -Parting Shot, -Payback, -Peck, -Petal Blizzard, -Petal Dance, -Phantom Force, -Photon Geyser, -Pin Missile, -Plasma Fists, -Play Rough, -Pluck, -Poison Fang, -Poison Gas, -Poison Jab, -Poison Powder, -Poison Sting, -Poison Tail, -Pollen Puff, -Powder, -Powder Snow, -Power Gem, -Power Split, -Power Swap, -Power Trick, -Power Trip, -Power Whip, -Power-Up Punch, -Precipice Blades, -Prismatic Laser, -Psybeam, -Psychic, -Psychic Fangs, -Psychic Terrain, -Psycho Boost, -Psycho Cut, -Psycho Shift, -Psyshock, -Psystrike, -Psywave, -Punishment, -Purify, -Pursuit, -Quash, -Quick Guard, -Quiver Dance, -Rage Powder, -Rain Dance, -Razor Leaf, -Razor Shell, -Reflect, -Rest, -Revenge, -Reversal, -Roar of Time, -Rock Blast, -Rock Polish, -Rock Slide, -Rock Smash, -Rock Throw, -Rock Tomb, -Rock Wrecker, -Role Play, -Rolling Kick, -Rollout, -Roost, -Rototiller, -Sacred Fire, -Sacred Sword, -Sand Attack, -Sand Tomb, -Sandstorm, -Savage Spin-Out, -Scald, -Searing Shot, -Searing Sunraze Smash, -Secret Sword, -Seed Bomb, -Seed Flare, -Seismic Toss, -Shadow Ball, -Shadow Bone, -Shadow Claw, -Shadow Force, -Shadow Punch, -Shadow Sneak, -Shadow Strike, -Shattered Psyche, -Sheer Cold, -Shell Trap, -Shift Gear, -Shock Wave, -Shore Up, -Signal Beam, -Silver Wind, -Sinister Arrow Raid, -Skill Swap, -Sky Attack, -Sky Drop, -Sky Uppercut, -Sleep Powder, -Sludge, -Sludge Bomb, -Sludge Wave, -Smack Down, -Smart Strike, -Smog, -Snarl, -Snatch, -Soak, -Solar Beam, -Solar Blade, -Soul-Stealing 7-Star Strike, -Spacial Rend, -Spark, -Sparkling Aria, -Spectral Thief, -Speed Swap, -Spider Web, -Spikes, -Spiky Shield, -Spirit Shackle, -Spite, -Splintered Stormshards, -Spore, -Stealth Rock, -Steam Eruption, -Steamroller, -Steel Wing, -Sticky Web, -Stoked Sparksurfer, -Stomping Tantrum, -Stone Edge, -Stored Power, -Storm Throw, -Strength Sap, -String Shot, -Struggle Bug, -Stun Spore, -Submission, -Subzero Slammer, -Sucker Punch, -Sunny Day, -Sunsteel Strike, -Superpower, -Supersonic Skystrike, -Surf, -Sweet Kiss, -Switcheroo, -Synchronoise, -Synthesis, -Tail Glow, -Tailwind, -Taunt, -Tectonic Rage, -Telekinesis, -Teleport, -Thief, -Thousand Arrows, -Thousand Waves, -Throat Chop, -Thunder, -Thunder Fang, -Thunder Punch, -Thunder Shock, -Thunder Wave, -Thunderbolt, -Topsy-Turvy, -Torment, -Toxic, -Toxic Spikes, -Toxic Thread, -Trick, -Trick Room, -Trick-or-Treat, -Triple Kick, -Trop Kick, -Twineedle, -Twinkle Tackle, -Twister, -U-turn, -V-create, -Vacuum Wave, -Venom Drench, -Venoshock, -Vine Whip, -Vital Throw, -Volt Switch, -Volt Tackle, -Wake-Up Slap, -Water Gun, -Water Pledge, -Water Pulse, -Water Shuriken, -Water Sport, -Water Spout, -Waterfall, -Whirlpool, -Wide Guard, -Wild Charge, -Will-O-Wisp, -Wing Attack, -Withdraw, -Wonder Room, -Wood Hammer, -Worry Seed, -X-Scissor, -Zap Cannon, -Zen Headbutt, -Zing Zap, -Acupressure, -After You, -Assist, -Attract, -Barrage, -Baton Pass, -Belly Drum, -Bestow, -Bide, -Bind, -Block, -Body Slam, -Boomburst, -Breakneck Blitz, -Camouflage, -Captivate, -Celebrate, -Chip Away, -Comet Punch, -Confide, -Constrict, -Conversion, -Conversion 2, -Copycat, -Covet, -Crush Claw, -Crush Grip, -Cut, -Defense Curl, -Disable, -Dizzy Punch, -Double Hit, -Double Slap, -Double Team, -Double-Edge, -Echoed Voice, -Egg Bomb, -Encore, -Endeavor, -Endure, -Entrainment, -Explosion, -Extreme Evoboost, -Extreme Speed, -Facade, -Fake Out, -False Swipe, -Feint, -Flail, -Flash, -Focus Energy, -Follow Me, -Foresight, -Frustration, -Fury Attack, -Fury Swipes, -Giga Impact, -Glare, -Growl, -Growth, -Guillotine, -Happy Hour, -Harden, -Head Charge, -Headbutt, -Heal Bell, -Helping Hand, -Hidden Power, -Hold Back, -Hold Hands, -Horn Attack, -Horn Drill, -Howl, -Hyper Beam, -Hyper Fang, -Hyper Voice, -Judgment, -Laser Focus, -Last Resort, -Leer, -Lock-On, -Lovely Kiss, -Lucky Chant, -Me First, -Mean Look, -Mega Kick, -Mega Punch, -Milk Drink, -Mimic, -Mind Reader, -Minimize, -Morning Sun, -Multi-Attack, -Natural Gift, -Nature Power, -Noble Roar, -Odor Sleuth, -Pain Split, -Pay Day, -Perish Song, -Play Nice, -Pound, -Present, -Protect, -Psych Up, -Pulverizing Pancake, -Quick Attack, -Rage, -Rapid Spin, -Razor Wind, -Recover, -Recycle, -Reflect Type, -Refresh, -Relic Song, -Retaliate, -Return, -Revelation Dance, -Roar, -Rock Climb, -Round, -Safeguard, -Scary Face, -Scratch, -Screech, -Secret Power, -Self-Destruct, -Sharpen, -Shell Smash, -Simple Beam, -Sing, -Sketch, -Skull Bash, -Slack Off, -Slam, -Slash, -Sleep Talk, -Smelling Salts, -Smokescreen, -Snore, -Soft-Boiled, -Sonic Boom, -Spike Cannon, -Spit Up, -Splash, -Spotlight, -Stockpile, -Stomp, -Strength, -Struggle, -Substitute, -Super Fang, -Supersonic, -Swagger, -Swallow, -Sweet Scent, -Swift, -Swords Dance, -Tackle, -Tail Slap, -Tail Whip, -Take Down, -Tearful Look, -Techno Blast, -Teeter Dance, -Thrash, -Tickle, -Transform, -Tri Attack, -Trump Card, -Uproar, -Vice Grip, -Weather Ball, -Whirlwind, -Wish, -Work Up, -Wrap, -Wring Out, -Yawn, -Focus Sash, -Sturdy, inversemod");
				this.say("/wall This is a Sheddy tour!");
				this.say("/tour name MSPL");
			default:
				format = Tools.getFormat(cmd);
				if (!format) return this.say('**Error:** invalid format.');
				if (!format.playable) return this.say(format.name + " cannot be played, please choose another format.");
				let cap;
				if (targets[1]) {
					cap = parseInt(Tools.toId(targets[1]));
					if (cap < 2 || cap > Tournaments.maxCap || isNaN(cap)) return this.say("**Error:** invalid participant cap.");
				}
				this.say("/tour new " + format.id + ", elimination, " + (cap ? cap + ", " : "") + (targets.length > 2 ? ", " + targets.slice(2).join(", ") : ""));
			}
		}
	},
	settour: 'settournament',
	settournament: function (target, room, user) {
		if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id) || !user.hasRank(room, '%')) return;
		if (room.id in Tournaments.tournamentTimers) {
			let warned = overwriteWarnings.has(room.id) && overwriteWarnings.get(room.id) === user.id;
			if (!warned) {
				overwriteWarnings.set(room.id, user.id);
				return this.say("A tournament has already been scheduled in this room. To overwrite it, please reuse this command.");
			}
			overwriteWarnings.delete(room.id);
		}
		let targets = target.split(',');
		if (targets.length < 2) return this.say(Config.commandCharacter + "settour - tier, time, cap (optional)");
		let format = Tools.getFormat(targets[0]);
		if (!format) return this.say('**Error:** invalid format.');
		if (!format.playable) return this.say(format.name + " cannot be played, please choose another format.");
		let date = new Date();
		let currentTime = (date.getHours() * 60 * 60 * 1000) + (date.getMinutes() * (60 * 1000)) + (date.getSeconds() * 1000) + date.getMilliseconds();
		let targetTime = 0;
		if (targets[1].includes(':')) {
			let parts = targets[1].split(':');
			let hours = parseInt(parts[0]);
			let minutes = parseInt(parts[1]);
			if (isNaN(hours) || isNaN(minutes)) return this.say("Please enter a valid time.");
			targetTime = (hours * 60 * 60 * 1000) + (minutes * (60 * 1000));
		} else {
			let hours = parseFloat(targets[1]);
			if (isNaN(hours)) return this.say("Please enter a valid time.");
			targetTime = currentTime + (hours * 60 * 60 * 1000);
		}
		let timer = targetTime - currentTime;
		if (timer <= 0) timer += 24 * 60 * 60 * 1000;
		Tournaments.setTournamentTimer(room, timer, format.id, targets[2] ? parseInt(targets[2]) : 0);
		this.say("The " + format.name + " tournament is scheduled for " + Tools.toDurationString(timer) + ".");
	},
	canceltour: 'canceltournament',
	canceltournament: function (target, room, user) {
		if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id) || !user.hasRank(room, '%')) return;
		if (!(room.id in Tournaments.tournamentTimers)) return this.say("There is no tournament scheduled for this room.");
		clearTimeout(Tournaments.tournamentTimers[room.id]);
		this.say("The scheduled tournament was canceled.");
	},
};

module.exports = commands;
