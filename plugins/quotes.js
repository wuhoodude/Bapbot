/**
 * Quotes
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * Manages the quotes system for the bot, allowing the adding,
 * removing, and viewing of added quotes.
 *
 * @author Mystifi
 * @license MIT license
 */

'use strict';

// These are the valid ranks that a Room Owner can set when
// modifying the permissions.
const validRanks = ['+', '%', '@', '#'];

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
	if (!database.quotes) database.quotes = [];
	if (!database.defaultRanks) {
		// This plugin allows the changing of which auth level(s)
		// have the ability to modify the room's quotes database.
		// Along with setting a default quotes rank, this allows
		// other rooms to add default ranks in this object.
		database.defaultRanks = {};
		database.defaultRanks['quotes'] = '+';
	}
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	quotesrank: 'setquotesrank',
	setquotesrank: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '#')) return;
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say("Users of rank " + database.defaultRanks['quotes'] + " and higher can manage room quotes.");
		if (!validRanks.includes(target)) return this.say("Unknown option. Valid ranks: " + validRanks.join(", "));
		database.defaultRanks['quotes'] = target;
		Storage.exportDatabase(room.id);
		this.say("Users of rank " + target + " and above can now manage room quotes.");
	},
	addbapquote: function (target, room, user) {
		if (room instanceof Users.User) return;
		let database = getDatabase("mspl");
		if (!user.hasRank(room, database.defaultRanks['quotes'])) return;
		target = target.trim();
		if (!target) return this.say("Please use the following format: .addbapquote quote");
		if (target.startsWith("/") || target.startsWith("!")) return this.say("You can't use a command in your quote.");
		let quotes = database.quotes;
		let index = quotes.findIndex(/**@param {string} quote */ quote => Tools.toId(quote) === Tools.toId(target));
		if (index >= 0) return this.say("That quote already exists.");
		quotes.push(target);
		Storage.exportDatabase(room.id);
		this.say("Your quote was successfully added.");
	},
	"deletebapquote":"removebapquote",
	removebapquote: function (target, room, user) {
		if (room instanceof Users.User) return;
		let database = getDatabase("mspl");
		if (!user.hasRank(room, database.defaultRanks['quotes'])) return;
		target = target.trim();
		if (!target) return this.say("Please use the following format: .removebapquote quote");
		let quotes = database.quotes;
		let index = quotes.findIndex(/**@param {string} quote */ quote => Tools.toId(quote) === Tools.toId(target));
		if (index < 0) return this.say("Your quote doesn't exist in the database.");
		quotes.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("Your quote was successfully removed.");
	},
	"randbapquote":"bapquote",
	bapquote: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		//let quotes = " "
		//if (target === "mspl") quotes = getDatabase("mspl").quotes;
		//if (!target) quotes = getDatabase(room.id).quotes;
		let quotes = getDatabase("mspl").quotes;
		if (!quotes.length) return this.say("This room doesn't have any quotes.");
		let randquote = Tools.sampleOne(quotes);
		if (randquote.trim().toLowerCase().endsWith('.png') || randquote.trim().toLowerCase().endsWith('.jpg')) {
			this.say(randquote);
			let link = '<img src=' +randquote + ' width=100% height=90% />';
			this.sayHtml(link);
		}else return this.say(randquote);
	},
	bapquotes: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		let quotes = getDatabase("mspl").quotes;
		if (!quotes.length) return this.say("This room doesn't have any quotes.");
		let prettifiedQuotes = "Quotes for " + room.id + ":\n\n" + quotes.map(
			/**
			 * @param {string} quote
			 * @param {number} index
			 */
			(quote, index) => (index + 1) + ": " + quote
		).join("\n");
		Tools.uploadToHastebin(prettifiedQuotes, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.say("Room quotes: " + hastebinUrl);
		});
	},
};

exports.commands = commands;