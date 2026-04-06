import { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';
import { buildFreshDateMenu } from '../stringSelectMenus/selectHomeWorkDate.js';


const physicsMatiereButton = new DiscordButton(new ButtonBuilder().setCustomId('physics_matiere').setLabel('Physique').setStyle(ButtonStyle.Primary), false, async (interaction) => {
    const dateMenu = buildFreshDateMenu();
   
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dateMenu);
    
    const currentEmbed = interaction.message.embeds[0];

    const updatedFields = currentEmbed.fields.map(field => {
        if (field.name === 'Matière') {
            return { name: field.name, value: `✅ **Physics**`, inline: field.inline };
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

export default physicsMatiereButton;
