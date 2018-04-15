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
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return;
		target = target.trim();
		if (!target) return this.say("Correct syntax: ``.addroast roast``");
		let roasts = database.roasts;
		let index = roasts.findIndex(/**@param {string} roast */ roast => Tools.toId(roast) === Tools.toId(target));
		if (index >= 0) return this.say("That roast already exists.");
		if (!target.includes('{user}')) return this.say("Your roast doesn't have the characters ``{user}`` in it. (``{}`` is used to locate where the target username goes when you use ``.roast {user}``)");
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
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return;
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
		if (room instanceof Users.User || !user.hasRank(room, '+') || database.roastbans.includes(Tools.toId(user))) return;
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
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		if (!target) return this.say("/wall BAP");
		this.pm(user, "/wall BAP");
		this.say("You cannot bap people");
		this.say("Also, get Bapped on");
		if (target === '`') return this.say ("/wall ~~BAP~~");
		if (target ==='*') return this.say ("/wall **BAP**");
		if (target === '_') return this.say ("/wall __BAP__");
		if (target ==='^') return this.say ("/wall ^^BAP^^");
		if (target ==='\ ') return this.say ("/wall \\BAP\\");
		if (target ==='`') return this.say ("/wall ``BAP``");
	},
	bop: function (target, room, user) {
		if (room instanceof Users.User || !canBop(user, room)) return this.say("Git good you have to be @ or dev to ~~ab00se~~ bop users");
		if (!target) return this.say ("``.bop user`` to bop");
		this.say("/mute " + target + ",bap");
		this.say("/hidetext " + target);
		this.say("/unmute " + target);
	},
	//Tour Commands
	pov: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '%')) return;
		this.say("/tour new gen7uu,elim");
		this.say("/tour rules -aggron-mega, -moltres, -snorlax, -hidden power, -regenerator");
		this.say("/wall This is a Povertymons tour!");
	},
	// General commands
	git: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say("Bapcode: https://github.com/wuhoodude/Bapbot");
	},
};

exports.commands = commands;
