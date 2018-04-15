# A Guide for Bapbot

## General
``.help``-Links to this guide<br>
``.git``-Links the code for Bapbot<br>
#### Bap
``.bap``-Bapbot says bap in the chat<br>
`` .bap ~`` ``.bap ~~`` ``.bap crossout`` ``.bap strikethrough`` ~~bap~~<br>
``.bap *`` ``.bap **`` ``.bap bold`` ``.bap strong``  **BAP**<br>
``.bap _`` ``.bap __`` ``.bap emphasis`` ``.bap italic``   <i>BAP</i><br>
``.bap ^`` ``.bap ^^`` ``.bap carrot``  ``.bap superscript`` <sup>BAP</sup><br>
``.bap \`` ``.bap \\`` ``subscript`` <sub>BAP</sub> <br>
``.bap ` `` .bap `` `` ``.bap code`` ``.bap inline`` ``BAP``<br>
``.bap >`` ``.bap greentext`` ``.bap memearrow`` >BAP
``.bap /`` ``.bap roleplay`` ``.bap me`` ``.bap /me`` • *Bapbot BAPS<br>
``.bap :`` ``.bap spoil`` ``.bap spoiler`` <spoiler>BAP</spoiler><br>
``.bap [`` ``.bap[[`` ``.bap link`` <a href="https://www.google.com/search?safe=strict&client=firefox-b-1&ei=o_jSWsXCG4XetQWHnae4CQ&q=BAP&oq=BAP&gs_l=psy-ab.12...0.0.0.13044.0.0.0.0.0.0.0.0..0.0....0...1c..64.psy-ab..0.0.0....0.mqkv_1bsQHg">BAP</a><br>






### @ only
``.bop [user]``-Mutes, clears text and unmutes a user<br>
## Uno
``.uno``-Creates an uno game<br>
``.uno start``-starts uno<br>
``.uno end``-ends uno<br>
## Quotes 
`.addquote [quote]` - adds quotes to the database<br>
`.removequote [quotes]` OR `.deletequote [quote]` -  deletes quotes from the database<br>
`.randquote` - bot generates a random quote from the database<br>
``.quotes``-Shows the room quotes<br>
## Roasts
``.addroast [roast]``-Adds roasts to the database<br>
``.removeroast [roast]``-Deletes roast from the database<br>
``.roast [user]``- Roasts a user<br>
``.roasts``-Shows the room's roasts<br>
### RO and Developers Only<br>
``.roastban user``-Bans user from using roast commands<br>
``.roastunban user``-Unbans user from the roast banlist<br>
``.roastbans``-Bapbot will show the roast banlist through PM<br>

# Cassius
[![Build Status](https://travis-ci.org/sirDonovan/Cassius.svg)](https://travis-ci.org/sirDonovan/Cassius)

A bot for [Pokemon Showdown][1].

  [1]: https://github.com/Zarel/Pokemon-Showdown

## Installation
Cassius requires [Node.js][2] version 6.0.0 or later and a command line (e.g. `Command Prompt` on Windows or `Terminal` on Mac OS/Linux) to run. Once you have compatible software, complete installation by following these steps:

1. Obtain a copy of Cassius

  You can do this through the [GitHub client][3] by clicking the "Clone or download" button on the home page of the repository and then clicking "Open in Desktop". You can also use the following [Git][4] command:
  
  `git clone https://github.com/sirDonovan/Cassius.git`

  [2]: https://nodejs.org/
  [3]: https://desktop.github.com/
  [4]: https://git-scm.com/

2. Navigate to the root directory

  The remaining steps will take place in the root directory of your Cassius files. Navigate there with the command:

  `cd DIRECTORY`
  
  Replace `DIRECTORY` with the filepath to your directory (e.g. `C:\Users\sirDonovan\Documents\GitHub\Cassius`).

3. Install dependencies

  Run the following command to install required dependencies:

  `npm install --production`

  If you plan to contribute to development, run the command without the `--production` flag to also install dependencies used for testing.

4. Set up the config file

  Copy and paste the `config-example.js` file, rename it to `config.js`, and open it in your text editor to enter your desired information.

From this point on, you can start the bot by running the following command:

  `node app.js`

## Development

  Issues and pull requests are welcomed! When submitting a pull request, be sure that you have installed development dependencies and ran `npm test` to check for errors in your code.

#### Credits

  * Quinton Lee ([@sirDonovan][5]) - Lead developer
  * [Pokemon Showdown][1] - In-game data files, Tools module, and various helper functions
  * [Contributors][6]

  [5]: https://github.com/sirDonovan
  [6]: https://github.com/sirDonovan/Cassius/graphs/contributors

## License

  Cassius is distributed under the terms of the [MIT License][7].

  [7]: https://github.com/sirDonovan/Cassius/blob/master/LICENSE
