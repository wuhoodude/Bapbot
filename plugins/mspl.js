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
	return user.isDeveloper() || user.hasRank(room, '%');
}
function canMegaBop(user, room) {
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
	if (!database.pickups) database.pickups = [];
	return database;
}
let bapDelay = {};
let slowBap = {};
let bapTimer = {};
let currentSlowbap = false;
let currentAutobap = 0;
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
		if (!target) return this.say("Use ``.addroast roast``and make sure you include {user} where an intended name would go");
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
	'deleteroast':'removeroast',
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
		let database = getDatabase("mspl");
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return this.say("You are not allowed to use roast commands");
		let roasts = database.roasts;
		if (!roasts.length) return this.say("This room doesn't have any roasts.");
		if (!target) return this.say("Correct syntax: ``.roast username``");
		if (Tools.toId(target) === 'bapbot') return this.say("YoU cAnNoT rOaSt Me");
		if (target.length > 18) return this.say("Please use a real username.");
		if (!(Tools.toId(target) in Users.users)) return this.say("That person isn't in the room");
		if (target[0] === '/') return this.say("Usernames aren't allowed to start with slashes.");
		this.say(Tools.sampleOne(roasts).replace(/{user}/g, target));
	},
	roasts: function (target, room, user) {
		let database = getDatabase("mspl");
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
	//Pickup lines
	addpickup: function (target, room, user) {
		let database = getDatabase("mspl");
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		target = target.trim();
		if (!target) return this.say("Use ``.addpickup pickup``and make sure you include {user} where an intended name would go");
		let pickups = database.pickups;
		let index = pickups.findIndex(/**@param {string} pickup */ pickup => Tools.toId(pickup) === Tools.toId(target));
		if (index >= 0) return this.say("That pickup already exists.");
		if (!target.includes('{user}')) return this.say("Your pickup doesn't have the characters ``{user}`` in it. (``{user}`` is used to locate where the target username goes when you use ``.pickup {user}``)");
		if (target[0] === '/') return this.say("Pickup lines aren't allowed to start with slashes.");
		for (const letter of target.replace(' ', '')) {
			if (target[target.indexOf(letter) + 1] === letter &&
				target[target.indexOf(letter) + 2] === letter &&
				target[target.indexOf(letter) + 3] === letter) {
				return this.say("Please don't put spam as a pickup.");
			}
		}
		pickups.push(target);
		Storage.exportDatabase(room.id);
		this.say("Your pickup line was successfully added.");
	},
	'deletepickup':'removepickup',
	removepickup: function (target, room, user) {
		let database = getDatabase("mspl");
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.removepickup pickup``");
		let pickups = database.pickups;
		let index = pickups.findIndex(/**@param {string} pickup */ pickup => Tools.toId(pickup) === Tools.toId(target));
		if (index < 0) return this.say("Your pickup line doesn't exist in the database.");
		pickups.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("Your pickup line was successfully removed.");
	},
	pickup: function (target, room, user) {
		let database = getDatabase("mspl");
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		let pickups = database.pickups;
		if (!pickups.length) return this.say("This room doesn't have any pickup lines.");
		if (!target) return this.say("Correct syntax: ``.pickup username``");
		if (target.length > 18) return this.say("Please use a real username.");
		if (!(Tools.toId(target) in Users.users)) return this.say("That person isn't in the room");
		if (target[0] === '/') return this.say("Usernames aren't allowed to start with slashes.");
		this.say(Tools.sampleOne(pickups).replace(/{user}/g, target));
	},
	'pickuplines':'pickups',
	pickups: function (target, room, user) {
		let database = getDatabase("mspl");
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let pickups = database.pickups;
		if (!pickups.length) return this.say("This room doesn't have any pickup lines.");
		let prettifiedQuotes = "Pickup lines for " + room.id + ":\n\n" + pickups.map(
			/**
			 * @param {string} pickup
			 * @param {number} index
			 */
			(pickup, index) => (index + 1) + ": " + pickup
		).join("\n");
		Tools.uploadToHastebin(prettifiedQuotes, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.say("Pickup liness: " + hastebinUrl);
		});
	},

	// Fun commands
	ask: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		
	},
	"butt":"booty",
	booty: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		var b = Math.floor((Math.random() * 3) + 1);
		for (let i = 1; i <= b; i++) {this.say(Tools.sampleOne(["butt", "booty"]));}
	},
	"mengyface":"mengy","mengularity":"mengy",
	mengy: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		if (!target) return this.say("㋛");
		if (!(Tools.toId(target) in Users.users)) return this.say("That person isn't in the room");
		this.pm(Tools.toId(target), "㋛");
		this.say("mengy'd");
		
	},
	pak: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		this.say("/wall __ganern__");
	},
	'vivalospride':'viv',
	viv: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let quote1 = ["deadass fax ", "straight up ", "literally ", "Hey, wanna share some opinions now, ", "Hola ", "Aight so ", "Aye, so ", "woah hold up ", "Hey! ", "owo ", "Holy señor, ", "Uh this is a tech that's pretty neat to deal with a lot of stuff, ", "Aight so I'm not gonna lie I don't understand what the fuck this is doing as a discussion point. ", "I didn't wanna come back to this thread but I have come in to bring all the hate for this mon to a halt. ", "Hola mates, ", "Aight uh here're some of my shitty thoughts, "]
		let quote2 = ["my man ", "this fuckin mon ", "", "fuckin ", "ngl I hate playing this tier right now bc ", "yall should know ", "i've been laddering for literally days and ", "ima try to keep this short but ", "i know it looks like straight booty but ", "goatmon ", "if ur using webs like me, ", "deadass ", "I don't think this mon is like nuts or anything but ", "yes. I was the one who nommed this thing to get on the vr in the first place, and after that I didn't use it for a while, but "]
		let quote3 = ["nihi ", "araquanid ", "vileplume ", "honch ", "sheddy ", "shedinja ", "tsar ", "cm coba aka seiballion ", "fight-z nape ", "fight-z kommo ", "umbreon ", "z-snatch krook ", "sd scep ", "lo stakatakataka ", "babiri toge ", "cb goodra (yes i know) ", "flame body chandy ", "smeargle ", "toxicroak ", "mega bronchitis ", "galv ", "mienshaolin "]
		let quote4 = ["is straight busted wtf", "is the fuckin paul pierce", "is super fuckin annoying", "is so fuckin splashable", "is easily A-", "is literally impossible to check", "is a broken mon", "can be plopped onto teams so fuckin easily", "is actual goat", "is legit unbeatable", "does a lot of damage I promise"]
		let quote5 = [" do not schleep.", " ngl.", " im telling you.", " rn.", " omfl.", ", especially on webs.", ", fr we should all be grateful this mon exists.", ", and it even has decent bulk.", " wtf.", ", bet.", " owo.", ", yes it loses to scizor but thats not its role.", ". This mon can work as an amazing wallbreaker throughout the match.", ". This mon is disgusting and it deserves some respect on it's name.", ", please someone explain how this mon deserves to even be remotely close to being mentioned for a downgrade.", ", please raise the lad.", ". this mon is dope.", ", and it pressures a lot of the tier's removal and wins 1v1."]
		let quote6 = [" Anyway Lati matchup on this team is LOL so hf w/ that lmao.", " Not like anyone listens to my suggestions anyway HAHAHAHAAHAAHAHAA", " the point is this mon gets a lot better post shifts", " Anyway like this post pls I spent deadass 12 hours testing shit on ladder n_n", " This mon is lit don't sleep pls thanks :D", " shoutout to martha for making this.", " so yeah vote ban n_n", " brb kms", " I made a post a while back on this mon that didn't really pick up any traction, hopefully this one is different.", " please rank this mon... idc where, just rank it.", " I don't wanna have to put up with this shit while building.", " I haven't tried this mon out yet but I doubt it'd be too bad", " Adaam can attest to how good this mon is rn.", " Also, Hydreigon definitely doesn't \"invalidate\" it...", " oh and it hurts like dicks", " Dw I have insomnia and literally don't sleep, I'll just hit u up if I see u online over the weekend.", " If anything it should be considered rising to S, I don't understand this at all u_u.", " Please someone explain how this mon deserves to even be remotely close to being mentioned for a downgrade rn.", " this mon has gotten significantly better in the past month or two, like seriously.", " I agree that this mon is mediocre as shit rn, but I've used it a lot.", " don't send this mon to the shadow realm and definitely don't call it an unmon.", " Move it up lads.", " idc fml kms brb owo smh.", " Idk what's gonna happen but idrc care enough to theorize.", " araq for b- n_n, c5 aoty"];
		return this.say(Tools.sampleOne(quote1)+Tools.sampleOne(quote2)+Tools.sampleOne(quote3)+Tools.sampleOne(quote4)+Tools.sampleOne(quote5)+Tools.sampleOne(quote6));
	},
	'euph':'euphonos',
	euphonos: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		return this.say("/wall __When it's brown, it's cooked; when it's black, it's fucked!__"); 
	},
	'bear':'bewear',
	bewear: function (target, room, user) {
		if (room instanceof Users.User) return;
		return this.say("\\\\{\\\\^\\\\°(T)°\\\\^\\\\}\\\\"); 
	},
	'bearmeme':'bewearmeme',
	bewearmeme: function (target, room, user) {
		if (room instanceof Users.User) return;
		let link = '<img src= "https://i.imgur.com/s79RHa4.png"width=70% height=60% />';
		this.sayHtml(link);
	},
	delaybap: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.bapbans.includes(Tools.toId(user))) return this.say("You are not allowed to bap");
		if (Number.parseInt(target) > 10) return this.say("The longest you can delay a bap is 10 seconds");
		if (Number.parseInt(target) <= 10){
			if(bapDelay) clearTimeout(bapDelay);
			bapDelay = setTimeout(() => this.say("bap"), target * 1000);
			return this.say("Your bap will arrive in " + target + " sec");
		}
	},
	autobap: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || database.bapbans.includes(Tools.toId(user)) || !user.isDeveloper) return this.say("You are not allowed to bap");
		if (Number.parseFloat(target) < 5 ) return this.say("The bap interval must be at least 5 seconds");
		if (Number.parseFloat(target) > 3600.0) return this.say("The maximum baps interval is 3600 seconds");
		function startAutobap() {
			if (bapTimer) clearInterval(bapTimer);
			bapTimer = setInterval(() => {room.say(Tools.sampleOne(["bap", ,"bap.", "bap?", "bap!", '"bap"', "bapbap", "bapbap?", "bapbap!"]));}, target * 1000);
			return room.say('Autobap has been set to ' + target + ' seconds');
		}
		function stopAutobap() {
			clearInterval(bapTimer);
			return room.say('Autobap has been turned off');
		}
		if (Number.parseFloat(target) <= 3600.0) {
			startAutobap();
			currentAutobap = target; 
		}
		if (['off'].includes(Tools.toId(target.trim()))) {
			if (currentAutobap === 0) return room.say('Autobap is already off');
			stopAutobap();	
			currentAutobap = 0;
		}
		if (!target) {
			if (currentAutobap === 0) {
				return room.say('Autobap is currently off');
			}
			else {
				return room.say("Autobap is currently set to " + currentAutobap + " seconds");
			}
		}
	},
	bap: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || database.bapbans.includes(Tools.toId(user))) return this.say("You are not allowed to bap");
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
		if (Tools.toId(target) === 'bapbot') return this.say("^^B^^\\\\a\\\\P \\\\b\\\\A^^p^^b\\\\o\\\\t");
		if (['m', 'mock'].includes(target)) return this.say("^^B^^\\\\a\\\\P");
		if (['disappear', 'invisible','magic'].includes(target)) return this.say("[[]]");
		if (['㋛'].includes(target)) return this.say("ⓑⓐⓟ");
		if (Number.parseFloat(target) > 5.0) return this.say("The maximum baps per bap is 5");//baps the target amount per command
		if (Number.parseInt(target) <= 5)  {
			if (currentSlowbap === true) return this.say("slowdown");//prevents spamming multibap
			if (currentSlowbap === false) {
				currentSlowbap = true;
				for (let i = 0; i < target; i++) {
				this.say("BAP");
			}
			slowBap = setTimeout(() => {currentSlowbap = false;}, 5 * 1000);
			return;
			}
		}
		if (!(Tools.toId(target) in Users.users)) return this.say("That person isn't in the room");
		this.pm(Tools.toId(target), "bap");
		this.say("bapped");
	
	},
	'randombap':'randbap',
	randbap: function (target, room, user) {
		let users = Object.keys(Users.users);
		let index = users.indexOf(Tools.toId("Bapbot"));
		if (index > -1) {
			users.splice(index, 1);
		}
		let pick = Tools.sampleOne(users)
		this.say("Bapped " + pick);
		this.pm(pick, "bap");
	},
	baproulette: function (target, room, user) {
		if (room instanceof Users.User) return this.say("You have to use this in a room");
		if (!target) return this.say(".baproulette [person1], [person2]...");
		let options = target.split(',');
		if (options.includes(Tools.toId("Bapbot"))) return this.say("I can't play baproulette");
		options.push(user.id)
		function checkName(options) {
			return Tools.toId(options) in Users.users
		}
		if (options.every(checkName) === false) return this.say("Someone there isn't in the room");
		let loser = options[Math.floor(Math.random() * options.length)].trim();
		this.say("It's a ~~TRAP~~ BAP for " + loser + "!!");
		for (var n = 0; n < 3 ; n++){
			this.pmHtml(loser, '<div style="color:#eeeeee;background-color:#003399;font-size:20px;overflow: visible;"><marquee behavior="alternate"<b>YOU LOST</b></marquee></div>');
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
		if ((room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say("!dice 100+100");
		this.say("!dice 6d13");
	},
	hangman: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let randomAnswer = Tools.sampleOne(["a", "b", "mengy", "lunch"])
		if (randomAnswer==="mengy" || randomAnswer==="lunch") {
			this.say("/hangman new " + randomAnswer + ",lunch OR mengy");
			return;
		}else this.say("/hangman new " + randomAnswer + ",a OR b");
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
		let link = '<img src=' + target + ' width=50% height=40% />';
		this.sayHtml(link);
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
		if (!target.trim().toLowerCase().endsWith('.gif') && !target.trim().toLowerCase().endsWith('.jpg')&& !target.trim().toLowerCase().endsWith('.png')) return this.say("Please provide an image or gif (url must end in .gif, .jpg or .png)");
		let link = '<details><summary>Expand</summary><img src=' + target + ' width=70% height=60% /></details>';
		this.sayHtml(link);
	},
	randgif: function (target, room, user) {
		let database = getDatabase(room.id);
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let gifs = getDatabase(room.id).gifs;
		if (!gifs.length) return this.say("This room doesn't have any gifs.");
		let box = '<details><summary>Expand</summary><img src=' + Tools.sampleOne(gifs) + ' width=70% height=60% /></details>';
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
		if (room instanceof Users.User || !canBop(user, room)) return this.say("Git good you have to be % or dev to ~~ab00se~~ bop users");
		if (!target) return this.say("``.bop user`` to bop");
		if (Tools.toId(target) === 'wuhoodude') {
			this.say('/mute ' + user.id + ",bap");
			this.say("/hidetext " + user.id);
			this.say("/unmute " + user.id);
			this.say("You no bop daddy");
			return;
		}
		this.say("/mute " + target + ",bap");
		this.say("/hidetext " + target);
		this.say("/unmute " + target);
		if (Tools.toId(target) === 'bapbot') {
			this.say('/mute ' + user.id + ",bap");
			this.say("/hidetext " + user.id);
			this.say("/unmute " + user.id);
			this.say("Get Bopped");
		this.sayHtml('<img src= https://media.giphy.com/media/zNXvBiNNcrjDW/giphy.gif  width=50% height=40% />');
			return;
		}
	},
	'mbop':'megabop', 'megabap':'megabop','mbap':'megabop',
	megabop: function (target, room, user) {
		if (room instanceof Users.User || !canMegaBop(user, room)) return this.say("Git good you have to be @ or dev to ~~ab00se~~ Megabop users");
		if (room.tour) return this.say("You can't do that during tours");
		let roomId = room.id;
		if (roomId.startsWith("battle")) return this.say("You can't do that in a battle");
		if (!target) return this.say("``.mbop user`` to bop");
		if (Tools.toId(target) === 'wuhoodude') {
			this.say('/rb ' + user.id + ",bap");
			this.say("/unban " + user.id);
			this.say("You no bop daddy");
			this.say("/invite " + user.id);
			return;
		}
		this.say("/rb " + target + ",bap");
		this.say("/unban " + target);
		this.say("/invite " + target);
		if (Tools.toId(target) === 'bapbot') {
			this.say("/rb " + user.id + ",bap");
			this.say("/unban " + user.id);
			this.say("/invite " + user.id);
			this.say("Get Bopped");
		this.sayHtml('<img src= https://media.giphy.com/media/zNXvBiNNcrjDW/giphy.gif  width=50% height=40% />');
			return;
		}
	},
	baplib: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let database = getDatabase("mspl")
		let quotes = database.quotes;
		let randquote1 = Tools.sampleOne(quotes);
		let randquote2 = Tools.sampleOne(quotes);
		if (randquote1.trim().toLowerCase().endsWith('.png') || randquote1.trim().toLowerCase().endsWith('.jpg')) {
			let link = '<img src=' +randquote1 + ' width=100% height=90% />';
			this.sayHtml(link + " " + randquote2);
		}else if (randquote2.trim().toLowerCase().endsWith('.png') || randquote2.trim().toLowerCase().endsWith('.jpg')) {
			let link = '<img src=' +randquote2 + ' width=100% height=90% />';
			this.sayHtml(randquote1 + " " + link);
		}else if ((randquote1.trim().toLowerCase().endsWith('.png') || randquote1.trim().toLowerCase().endsWith('.jpg')) && (randquote2.trim().toLowerCase().endsWith('.png') || randquote2.trim().toLowerCase().endsWith('.jpg'))) {
			let link1 = '<img src=' +randquote1 + ' width=70% height=60% />';
			let link2 = '<img src=' +randquote2 + ' width=70% height=60% />';
			return this.sayHtml(link1+link2);
		}else if (randquote1.includes("http") || randquote2.includes("http")) {
			if (randquote1.includes("http") && randquote2.includes("http")) {
				let link1 = '<a href="' + randquote1 + '">' + randquote1 + '</a>';
				let link2 = '<a href="' + randquote2 + '">' + randquote2 + '</a>';
				return this.sayHtml(link1 + " " + link2);
			}else if (randquote1.includes("http")) {
				let link1 = '<a href="' + randquote1 + '">' + randquote1 + '</a>';
				return this.sayHtml(link1 + ' ' + randquote2);
			}else {
				let link2 = '<a href="' + randquote2 + '">' + randquote2 + '</a>';
				return this.sayHtml(randquote1 + ' ' + link2);
			}
		}else return this.sayHtml(randquote1 + " " + randquote2);
	},
	uno: function (target, room, user) {
	if (room instanceof Users.User || !user.hasRank(room, '+')) return;
	this.say("/uno new");
	},
	// General commands
	calc: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		let answer = eval(target);
		this.say(answer);
	},
	'code':'git', 'bapcode':'git',
	git: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say("Bapcode: https://github.com/wuhoodude/Bapbot");
	},
	joinroom: function (target, room, user) {
		if (room instanceof Users.User || !canRoastban(user, room)) return this.say("You can't do that");
		this.say("/j " + target);
	},
	'leave':'leaveroom',
	leaveroom: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '☆') && !user.isDeveloper()) return this.say("You can't do that");
		this.say("Bap bap away");
		this.say("/leave");
	},
	usercount: function (target, room, user) {
		if (room instanceof Users.User) return;
		let users = Object.keys(Users.users);
		this.say("There are " + room.users.size + " users in the room");
	},
	'kill':'logout',
	logout: function (target, room, user) {
		if (!(room instanceof Users.User) && !canRoastban(user, room)) return this.say("You can't do that");
		this.say("Bap bap away");
		this.say("/logout");
	},
	'forcekill':'forcelogout',
	forcelogout: function (target, room, user) {
		if (!(room instanceof Users.User) && !canRoastban(user, room)) return this.say("You can't do that");
		process.exit();
	},
	speeduno: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return; 
		this.say("/uno new");
		this.say("/uno autostart 30");
		this.say("/uno timer 5");
	},
	test: function (target, room, user) {
		if (!user.isDeveloper()) return;
		let users = Object.keys(Users.users);
		console.log(users);
	},
	sayMspl: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.saymspl(target);
	},
};

exports.commands = commands;
