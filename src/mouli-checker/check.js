import fs from 'fs';
import { main } from './main.js';
import { yearParser } from './year-parser.js';
import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

export async function check(client) {
    console.log("[LOG] Mouli check")
    let last;
    try {
        last = fs.readFileSync('data.json', 'utf-8');
    } catch (error) {
        last = "0";
        fs.writeFileSync('data.json', last, 'utf-8');
    }
    const json = JSON.parse(last);

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

    const mouli = mouliOrders[0]
    if (mouli[2] > json) {
        const newData = mouli[2];
        const component = new ContainerBuilder();

        const mouliName = mouli[0];

		const date = `<t:${mouli[2]}:R>`;
		component.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`### ──┤ New Mouli ├──\nName: **${mouliName}**\nDate: **${date}**\nId: **${mouli[3]}**\n@everyone`)
		)

        client.channels.cache.get(process.env.CHANNEL_ID).send({ components: [component], flags: [MessageFlags.IsComponentsV2] });
        fs.writeFileSync('data.json', `${newData}`, 'utf-8')
    }
}