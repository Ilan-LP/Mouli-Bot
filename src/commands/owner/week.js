const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { calendar } = require('../../my-checker/main.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('week')
		.setDescription('Show week calendar'),
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
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString().split('T')[0];
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay())).toISOString().split('T')[0];

        const data = await calendar(startDate, endDate);

        data.sort((a, b) => {
            const dateAStart = new Date(a.startDate || a.activityStartDate);
            const dateBStart = new Date(b.startDate || b.activityStartDate);
            if (dateAStart.getTime() === dateBStart.getTime()) {
                const dateAEnd = new Date(a.endDate || a.activityEndDate);
                const dateBEnd = new Date(b.endDate || b.activityEndDate);
                return dateAEnd.getTime() - dateBEnd.getTime();
            }
            return dateAStart.getTime() - dateBStart.getTime();
        });
        const component = 
        	new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### ──┤ Week Calendar ├──`)
            );
        let days = {};
        for (const event of data) {
            const eventDate = new Date(event.startDate || event.activityStartDate).toISOString().split('T')[0];
            const title = event.activityName;
            if (!days[eventDate]) days[eventDate] = [];
            days[eventDate].push(title);
        }
        for (const day in days) {
            const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'long' }); 
            let text = `**${dayName}:**\n`;
            for (const titleIndex in days[day]) {
                text += `   **${days[day][titleIndex]}**`;
                if (titleIndex < days[day].length - 1) text += `\n`;
            }
            
            component.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(text)
            );
        }
        await interaction.editReply({ components: [component], flags: [MessageFlags.IsComponentsV2] });
    }
};