/**
 * Bap game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * @license MIT license
 */

'use strict';
const data = {"Bap": {}};
const name = "Bap";
const bap = Storage.getDatabase('bap');
for (let i in Tools.data.bap) {
	let bap = Tools.data.bap[i];
	if (!bap.name) continue;
	let desc = bap.desc || bap.shortDesc;
	if (!desc) continue;
	if (!(desc in data["Bap"])) data["Bap"][desc] = [];
	data["Bap"][desc].push(bap.name);
}

// if inheriting from or inherited by another game, this class would be declared as:
// let Trivia = base => class extends base {
class Bap extends Games.Game {
	/**
	 * @param {Room} room
	 */
	constructor(room) {
		super(room);
		this.freeJoin = true;
		/**@type {Array<string>} */
		this.answers = [];
		/**@type {?NodeJS.Timer} */
		this.timeout = null;
		this.hint = '';
		this.points = new Map();
		this.maxPoints = 5;
		this.categories = Object.keys(data);
		this.questions = {};
		for (let i = 0, len = this.categories.length; i < len; i++) {
			this.questions[this.categories[i]] = Object.keys(data[this.categories[i]]);
		}
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	setAnswers() {
		let category;
		if (this.variation) {
			category = this.variation;
		} else {
			category = Tools.sampleOne(this.categories);
		}
		let question = Tools.sampleOne(this.questions[category]);
		this.answers = data[category][question];
		this.hint = "**" + category + "**: " + question;
	}

	onNextRound() {
		if (this.answers.length) {
			this.say("Time's up! The answer" + (this.answers.length > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
		}
		this.setAnswers();
		this.on(this.hint, () => {
			this.timeout = setTimeout(() => this.nextRound(), 8 * 1000);
		});
		this.say(this.hint);
	}
}

exports.name = name;
exports.id = Tools.toId(name);
exports.description = "Who can bap the fastest?";
exports.commands = {
	// command: game function
	// alias: command
	"guess": "guess",
	"g": "guess",
};
exports.aliases = ['bap'];
exports.variations = [
	{
		name: "Bap Trivia",
		aliases: ['Bap Race'],
		variation: "Bap Racer",
		variationAliases: ['bap'],
	},
];
exports.modes = ["Survival", "Team"];
// if inheriting from or inherited by another game, this game would be exported as:
// exports.install = Trivia;
exports.game = Bap;

/**
 * @param {Bap} game
 */
exports.spawnMochaTests = function (game) {
	// you can skip tests for variations or modes by checking "game.variationId" or "game.modeId" here
	if (game.modeId) return;

	const assert = require('assert');

	let tests = {
		/**
		 * @param {Bap} game
		 */
		'guess': game => {
			game.signups();
			game.nextRound();
			MessageParser.parseCommand(Config.commandCharacter + 'guess ' + game.answers[0], game.room, Users.add("User 1"));
			assert(game.points.get(game.players['user1']) === 1);
		},
	};

	return tests;
};