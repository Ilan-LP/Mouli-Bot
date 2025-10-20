const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const deployCommands = require('./deploy-commands.js');
const config = require('./config.js');
const { check } = require('./mouli-checker/check.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`);
		}
	}
}

client.once(Events.ClientReady, async readyClient => {
	try {
		await deployCommands();
	} catch (error) {
		console.error('[ERROR] Failed to deploy commands:', error);
	}
	
	console.log(`[LOG] Ready! Logged in as ${readyClient.user.tag}`);

	// function scheduleNextCheck(client) {
	// 	const delay = (Math.random() * (10 - 5) + 5) * 60 * 1000;
	// 	setTimeout(() => {check(client);scheduleNextCheck();}, delay);
	// }

	// check(client)
	// scheduleNextCheck(client);
});


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`[ERROR] No command matching ${interaction.commandName} was found`);
		return;
	}

	try 
	{
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		const component = [
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ Error ├──\nThere was an error while executing this command!`)
			)
		];
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ components: component, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
		} else {
			await interaction.reply({ components: component, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
		}
	}
});


client.login(config.token);