import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } from 'discord.js';
import DiscordModal from '../../utils/classes/DiscordModal.js';
import Devoirs from '../../database/models/Devoirs.js';
import DevoirsManager from '../../systems/DevoirsManager.js';

const modal = new ModalBuilder()
    .setCustomId('addDevoirModal')
    .setTitle('Ajouter un devoir')
    .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirType').setLabel('Matière').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirDescription').setLabel('Description du devoir').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirDueDate').setLabel('Date limite (JJ/MM/AAAA)').setStyle(TextInputStyle.Short).setRequired(true))
    );

const addDevoirModal = new DiscordModal(modal, true, async (interaction) => {
    const description = interaction.fields.getTextInputValue('devoirDescription');
    const dueDate = interaction.fields.getTextInputValue('devoirDueDate');
    const type = interaction.fields.getTextInputValue('devoirType');
    try {
        await Devoirs.create({
            description,
            dueTimestamp: dueDate,
            type,
        });

        await DevoirsManager.updateDevoirs();

        const embed = new EmbedBuilder()
            .setTitle('Nouveau devoir ajouté')
            .addFields({ name: 'Matière', value: type, inline: true }, { name: 'Description', value: description, inline: false }, { name: 'Date limite', value: dueDate, inline: true })
            .setColor(0x3498db);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
        const errorEmbed = new EmbedBuilder().setTitle('Erreur').setDescription("Erreur lors de l'ajout du devoir.").setColor(0xe74c3c);
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
});

export default addDevoirModal;
