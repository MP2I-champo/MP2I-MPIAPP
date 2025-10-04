import { ButtonBuilder, ButtonStyle } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';
import addDevoirModal from '../modals/addWork.js';

const addWorkButton = new DiscordButton(new ButtonBuilder().setCustomId('add_work').setLabel('Ajouter un devoir').setStyle(ButtonStyle.Success), false, async (interaction) => {
    await interaction.showModal(addDevoirModal.modal);
});

export default addWorkButton;
