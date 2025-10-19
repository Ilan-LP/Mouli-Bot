const { REST, Routes } = require('discord.js');
const config = require('./config.js');

const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {

	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`);
		}
	}
}

const rest = new REST().setToken(config.token);

async function deployCommands() {
	try {
		console.log(`[LOG] Started refreshing ${commands.length} application (/) commands`);

		const data = await rest.put(
			Routes.applicationCommands(config.clientId),
			{ body: commands },
		);

		console.log(`[LOG] Successfully reloaded ${data.length} application (/) commands`);
		return data;
	} catch (error) {
		console.error(`[ERROR] ${error}`);
		throw error;
	}
}

module.exports = deployCommands;

if (require.main === module) {
	deployCommands();
}