const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { main, getFetchUrl, bis } = require('../../mouli-checker/main.js');
const { mouliParser } = require('../../mouli-checker/mouli-parser.js');
const { getFailedOutputText } = require('../../mouli-checker/fail.js'); 

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mouli-check-slug')
		.setDescription('View the stats of a specific mouli')
		.addStringOption((option) => option.setName('id').setDescription('The slug of the mouli to check').setRequired(true)),
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
            const component = [
                new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### ──┤ Mouli Not Found ├──\nThe mouli with the provided slug was not found`)
                )
            ];
            await interaction.editReply({ components: component, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
            return;
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
				new TextDisplayBuilder().setContent(`### ──┤ ${parsedData.name} ├──\n**${pourcent}\n${count}**\n`)
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
        
        const logDetails = parsedData.comment;
        const error = getFailedOutputText(logDetails);
        component.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### ──┤ Error ├──\n${error ? "```\n" + error + "\n```" : "All tasks passed successfully!"}\n`)
        );

        component.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${date}**\n-# *Id: ${parsedData.slug}*\n`)
        );

		await interaction.editReply({ components: [component], flags: [MessageFlags.IsComponentsV2] });
		console.log("[LOG] Mouli stats sent to user");
	}
}