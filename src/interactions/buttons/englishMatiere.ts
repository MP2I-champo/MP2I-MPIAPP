import { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';
import { buildFreshDateMenu } from '../stringSelectMenus/selectHomeWorkDate.js';


const englishMatiereButton = new DiscordButton(new ButtonBuilder().setCustomId('english_matiere').setLabel('Anglais').setStyle(ButtonStyle.Primary), false, async (interaction) => {
    const dateMenu = buildFreshDateMenu();
   
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dateMenu);
    
    const currentEmbed = interaction.message.embeds[0];

    const updatedFields = currentEmbed.fields.map(field => {
        if (field.name === 'Matière') {
            return { name: field.name, value: `✅ **Anglais**`, inline: field.inline };
        }
            return { name: field.name, value: field.value, inline: field.inline };
    });

    const updatedEmbed = EmbedBuilder.from(currentEmbed)
        .setDescription('Sélectionnez la date de rendu.')
        .setFields(updatedFields);


    await interaction.update({
            embeds: [updatedEmbed],
            components: [row]
    });
});

export default englishMatiereButton;
