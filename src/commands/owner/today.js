const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { calendar } = require('../../my-checker/main.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('today')
		.setDescription('Show today calendar'),
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
        const today = new Date().toISOString().split('T')[0];
		const data = await calendar(today, today);

        const component = 
			new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### ──┤ Today Calendar ├──`)
            )

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

        for (const event of data) {
            const startDate = new Date(event.startDate || event.activityStartDate);
            const endDate = new Date(event.endDate || event.activityEndDate);

            const start = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const end = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const title = event.activityName
            const room = event.rooms[0]
            component.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${start}-${end}:\n   ${title}** ${room ? `\n   _${room.name}_` : ''}`)
            )
        }
		await interaction.editReply({ components: [component], flags: [MessageFlags.IsComponentsV2] });
	},
};