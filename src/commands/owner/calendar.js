const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { calendar } = require('../../my-checker/main.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('calendar')
		.setDescription('Show calendar')
        .addStringOption(option =>
            option.setName('start-date')
                .setDescription('(DD-MM-YYYY) The start date to fetch the calendar from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('end-date')
                .setDescription('(DD-MM-YYYY) The end date to fetch the calendar from')
                .setRequired(false)
        ),
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
        const startDateInput = interaction.options.getString('start-date');
        const endDateInput = interaction.options.getString('end-date') || startDateInput;

        const isValidDateFormat = (dateString) => {
            const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
            const match = dateString.match(regex);
            if (!match) return false;

            const day = parseInt(match[1]);
            const month = parseInt(match[2]);
            const year = parseInt(match[3]);

            if (day < 1 || day > 31) return false;
            if (month < 1 || month > 12) return false;
            
            const date = new Date(year, month - 1, day);
            return (
                date.getFullYear() === year &&
                date.getMonth() === month - 1 &&
                date.getDate() === day
            );
        };
        
        if (!isValidDateFormat(startDateInput) || !isValidDateFormat(endDateInput)) {
            const errorComponent = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### ──┤ Format Error ├──\nInvalid date format. Please use DD-MM-YYYY format`)
            );
            await interaction.editReply({ components: [errorComponent], flags: [MessageFlags.IsComponentsV2] });
            return;
        }
        
        const convertDateFormat = (dateString) => {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}`;
        };
        
        const startDate = convertDateFormat(startDateInput);
        const endDate = convertDateFormat(endDateInput);
        
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
        
        if (startDate === endDate) {
            const component = 
		    	new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### ──┤ ${startDateInput} Calendar ├──`)
                )
            
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
        } else {
            const component = 
            	new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`### ──┤ ${startDateInput} to ${endDateInput} Calendar ├──`)
                );
            let days = {};
            for (const event of data) {
                const eventDate = new Date(event.startDate || event.activityStartDate).toISOString().split('T')[0];
                const title = event.activityName;

                if (!days[eventDate]) days[eventDate] = [];
                days[eventDate].push(title);
            }

            for (const day in days) {
                let text = `**${day}:**\n`;
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
	},
};