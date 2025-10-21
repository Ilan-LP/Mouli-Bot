const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { logTime } = require('../../my-checker/main.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('logtime')
		.setDescription('View logtime'),
	async execute(interaction) {
		if (interaction.user.id != process.env.OWNER_ID) {
			const component = [
				new ContainerBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### ──┤ Permission Denied ├──\nThis command is restricted to the bot owner only`)
				)
			];

            await interaction.reply({ components: component, flags: [MessageFlags.IsComponentsV2] });
            return;
        }
		
		await interaction.deferReply();
		const data = await logTime();
		let time = 0
		let days = 0
		let daysAll = 0
		let firstDay = false

		for (const day of data) {
			const logtime =  parseInt(day.log_time.slice(2,-1))
			if (!firstDay) {
				if (logtime > 0) {
					time += logtime
					days ++
					daysAll ++
					firstDay = true
				}
			} else {
				if (logtime > 0) {
					time += logtime
					days ++
				}
				daysAll ++
			}
			
		}
		const average = Math.round(time/60/60/days * 10) /10
		const averageAll = Math.round(time/60/60/daysAll * 10) /10

		const component = [
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ LogTime ├──\nAverage: **${average}h**\nAverage (All days): **${averageAll}h**`)
			)
		];
		await interaction.editReply({ components: component, flags: [MessageFlags.IsComponentsV2] });
	},
};