const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { main } = require('../../mouli-checker/main.js');
const { yearParser } = require('../../mouli-checker/year-parser.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('all')
		.setDescription('View all moulis stats'),
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
		const component = new ContainerBuilder();
		const {data} = await main();
		const parsedData = yearParser(data);

		const mouliOrders = [];
		for (const mouli in parsedData) {
			if (mouliOrders.length === 0) {
				mouliOrders.push([mouli, parsedData[mouli].pourcent, parsedData[mouli].date, parsedData[mouli].slug]);
				continue;
			}
			for (const i in mouliOrders) {
				if (parsedData[mouli].date > mouliOrders[i][2]) {
					mouliOrders.splice(i, 0, [mouli, parsedData[mouli].pourcent, parsedData[mouli].date, parsedData[mouli].slug]);
					break;
				}
			}
		}

		let countMouli = 0;
		for (const mouli of mouliOrders) {
			const mouliName = mouli[0];

			let pourcent = mouli[1] + "%";
			if (mouli[1] >= 75) {
				pourcent += " 🟢";
			} else if (mouli[1] >= 50) {
				pourcent += " 🟡";
			} else if (mouli[1] >= 25) {
				pourcent += " 🟠";
			} else {
				pourcent += " 🔴";
			}
			
			let count =  Math.floor(mouli[1] / 5);
			count = "█".repeat(count) + "░".repeat(20 - count);
			const date = `<t:${mouli[2]}:R>`;
			component.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ ${mouliName} ├──\n**${pourcent}**\n**${count}**\n**${date}**\n-# *Slug: ${mouli[3]}*\n`)
			)
			countMouli++;
			if (countMouli >= 5) break;
		}

		await interaction.editReply({ components: [component], flags: [MessageFlags.IsComponentsV2] });
		console.log("[LOG] All moulis stats sent to user");
	},
};