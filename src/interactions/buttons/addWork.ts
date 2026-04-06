import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';

import mathMatiere from './mathMatiere.js';
import infoMatiere from './infoMatiere.js';
import physicsMatiere from './physicsMatiere.js';
import englishMatiere from './englishMatiere.js';
import autreMatiere from './autreMatiere.js';
import frenchMatiere from './frenchMatiere.js';
import SIMatiere from './SIMatiere.js';

const matiereEmbed = new EmbedBuilder()
    .setTitle('📚 Ajouter un devoir')
    .setDescription('Sélectionnez la matière ci-dessous.')
    .addFields(
            { name: 'Matière', value: '⏳ En attente...', inline: true },
            { name: 'Date de rendu', value: '⏳ En attente...', inline: true },
            { name: 'Description', value: '⏳ En attente...', inline: true },
        )
    .setColor(0x3498db);

const addWorkButton = new DiscordButton(new ButtonBuilder().setCustomId('add_work').setLabel('Ajouter un devoir').setStyle(ButtonStyle.Success), false, async (interaction) => {
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(mathMatiere.button, infoMatiere.button, physicsMatiere.button, englishMatiere.button, frenchMatiere.button);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(SIMatiere.button, autreMatiere.button);

    await interaction.reply({embeds: [matiereEmbed], components: [row1, row2], flags: MessageFlags.Ephemeral}) 
});

export default addWorkButton;
