import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';

const deleteWorkButton = new DiscordButton(new ButtonBuilder().setCustomId('delete_work').setLabel('Supprimer un devoir').setStyle(ButtonStyle.Danger), false, async (interaction) => {

    // Here build a select menu (one is likely enough, no need to handle 25+ things)
    await interaction.reply({content : "WIP", flags: MessageFlags.Ephemeral}) 
});

export default deleteWorkButton;
