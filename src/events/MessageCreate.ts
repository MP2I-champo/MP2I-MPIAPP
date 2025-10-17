import { EmbedBuilder, Events, Message, TextChannel } from 'discord.js';
import { containsCitation, getCitationsInMessage } from '../utils/citations.js';
import { isMathTeacherCalypse, setMathTeacherCalypse } from '../utils/mathTeacherCalypse.js';
import params from "../../params.json" with {type: 'json'}

export const name = Events.MessageCreate;
export const once = false;
export async function execute(message: Message): Promise<void> {
    if (message.author?.bot) return;

    if (containsCitation(message.content)) {
        const foundCitations = getCitationsInMessage(message.content);
        foundCitations.forEach(async (citation) => {
            const randomColor = Math.floor(Math.random() * 0xffffff);
            const citationEmbed = new EmbedBuilder().setColor(randomColor).setDescription(`"${citation.citation}" ${citation.author}`);
            await message.reply({ embeds: [citationEmbed] }).catch(console.error);
        });
    }

    if (isMathTeacherCalypse()) {
        await message.react(params.emojis.mathTeacher).catch(console.error);
    } else {
        const triggerMathTeacherCalypse = Math.random() < 0.003;
        if (triggerMathTeacherCalypse) {
            setMathTeacherCalypse(true);
            await message
                .reply(
                    `Une ${params.mathTeacher}Calypse ${params.emojis.mathTeacher} a été déclenchée ! Tous les messages pendant les 30 prochaines minutes seront ${params.mathTeacher}sés ${params.emojis.mathTeacher}${params.emojis.mathTeacher}${params.emojis.mathTeacher}.`
                )
                .catch(console.error);
            await message.react(params.emojis.mathTeacher).catch(console.error);

            setTimeout(async () => {
		setMathTeacherCalypse(false);
		const channel = message.channel as TextChannel;
		await channel.send(`Le temps est écoulé, ${params.mathTeacher} arrête de se manifester... il reviendra peut-être une autre fois...`);
	    }, 30 * 60 * 1000);
        }
    }
}
