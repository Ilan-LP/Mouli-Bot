const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { main, getFetchUrl, bis } = require('../../mouli-checker/main.js');
const { mouliParser } = require('../../mouli-checker/mouli-parser.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('last')
		.setDescription('View the last mouli stats')
		.addStringOption((option) => option.setName('id').setDescription('The id of the mouli to check').setRequired(false)),
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
		const {data, year} = await main();

        let newData = null;
        if (interaction.options.getString('id')) {
            const mouliSlug = interaction.options.getString('id');
            for (const mouli in data) {
                if (data[mouli].project.slug == mouliSlug) {
                    newData = data[mouli];
                    break;
                }
            }
        }
        if (!newData) {
            let best = [];
            for (const mouli in data) {
                let date = data[mouli].date;
                const timestamp = Date.parse(date);
                if (best.length === 0) {
                    best = [mouli, timestamp];
                } else if (timestamp >= best[1]) {
                    best = [mouli, timestamp];
                }
            }

            newData = data[best[0]];
        }

        let type = "unknown";
        if (Object.keys(newData).includes("project")) {
            type = "project";
        } else if (Object.keys(newData).includes("module")) {
            type = "module";
        } else if (Object.keys(newData).includes("details")) {
            type = "details";
        }

        let newUrl = "https://myresults.epitest.eu/index.html";
        if (type == "project") {
            newUrl += "#d/" + year + "/" + newData.project.module.code + "/" + newData.project.slug + "/" + newData.results.testRunId;
        }
        const fetchUrl = getFetchUrl(newUrl);
        const goodData = await bis(fetchUrl);

        const parsedData = mouliParser(goodData);

        const component = new ContainerBuilder();

        const date = `<t:${parsedData.date}:R>`;

        let pourcent = parsedData.pourcent + "%";
			if (parsedData.pourcent >= 75) {
				pourcent += " 🟢";
			} else if (parsedData.pourcent >= 50) {
				pourcent += " 🟡";
			} else if (parsedData.pourcent >= 25) {
				pourcent += " 🟠";
			} else {
                pourcent += " 🔴";
            }
			
			let count =  Math.floor(parsedData.pourcent / 5);
			count = "█".repeat(count) + "░".repeat(20 - count);

        component.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ──┤ ${parsedData.name} ├──\nPourcent: **${pourcent}**\n**${count}**\n`)
			)
        for (let task in parsedData.task) {
            const status = parsedData.task[task] ? "✅" : "❌";
            
            let formattedTask = task;
            if (formattedTask.includes(" - ")) {
                formattedTask = formattedTask.split(" - ")[1];
            }
            formattedTask = formattedTask.charAt(0).toUpperCase() + formattedTask.slice(1);
            
            component.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${status} ${formattedTask}**\n`)
            )
        }

        component.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`Date: **${date}**\nId: **${parsedData.slug}**\n`)
        );

		await interaction.editReply({ components: [component], flags: [MessageFlags.IsComponentsV2] });
		console.log("[LOG] Mouli stats sent to user");
	}
}