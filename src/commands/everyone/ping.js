const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { uptime } = require('process');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('View bot information'),
	async execute(interaction) {
		let responde_time = Date.now();

		let api_latency = Math.round(interaction.client.ws.ping);
		if (api_latency < 0) {
			api_latency = 0;
		}

		const api_latency_text = `${api_latency}ms`;

		const bot_uptime = Math.round(uptime());
		let bot_uptime_text = `<t:${Math.floor(Date.now() / 1000) - bot_uptime}:R>`;
	

		const guilds = await interaction.client.guilds.fetch();

		const ram = process.memoryUsage().heapUsed / 1024 / 1024;
		const ram_text = `${Math.round(ram * 100) / 100} MB`;

		const node_version = process.version;

		const discordjs_version = require('discord.js').version;

		responde_time = Date.now() - responde_time;
		let responde_time_text = `${responde_time}ms`;

		const component = [
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ Network ├──\nAPI Latency: **${api_latency_text}**\nResponse Time: **${responde_time_text}**\n\n`)
			).addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ System ├──\nBot Uptime: **${bot_uptime_text}**\nRam Usage: **${ram_text}**\n\n`)
			).addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ Environnement ├──\nGuilds: **${guilds.size}**\nNode.js Version: **${node_version}**\nDiscord.js Version: **${discordjs_version}**`)
			)
		];
		await interaction.reply({ components: component, flags: [MessageFlags.IsComponentsV2] });
		console.log("[LOG] Ping info sent to user");
	},
};