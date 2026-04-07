import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import DiscordModal from '../../utils/classes/DiscordModal.js';
import Devoirs from '../../database/models/Devoirs.js';
import DevoirsManager from '../../systems/DevoirsManager.js';

export function buildFreshHmwkModal (matiere: string, date: string): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId('add_devoir_modal')
        .setTitle('Ajouter un devoir')
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirType').setLabel('Matière').setStyle(TextInputStyle.Short).setValue(matiere).setRequired(true)),
            new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirDescription').setLabel('Description du devoir').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirDueDate').setLabel('Date limite (JJ/MM/AAAA)').setStyle(TextInputStyle.Short).setValue(date).setRequired(true))
    );
    
    return modal;
}

const modal = new ModalBuilder()
    .setCustomId('add_devoir_modal')
    .setTitle('Ajouter un devoir')
    .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirType').setLabel('Matière').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirDescription').setLabel('Description du devoir').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('devoirDueDate').setLabel('Date limite (JJ/MM/AAAA)').setStyle(TextInputStyle.Short).setRequired(true))
    );

const addDevoirModal = new DiscordModal(modal, true, async (interaction) => {
    if(!interaction.message) return;

    const description = interaction.fields.getTextInputValue('devoirDescription');
    const dueDate = interaction.fields.getTextInputValue('devoirDueDate');
    const type = interaction.fields.getTextInputValue('devoirType');

    try {
        await Devoirs.create({
            description,
            dueTimestamp: dueDate,
            type,
            author: interaction.user.id
        });

        await DevoirsManager.updateDevoirs();
        
        const currentEmbed = interaction.message.embeds[0];
        
        const updatedFields = currentEmbed.fields.map(field => {
            if (field.name === 'Date de rendu') {
                return { name: field.name, value: `✅ **${dueDate}**`, inline: field.inline };
            } else if (field.name === 'Description') {
                return { name: field.name, value: description ? description : " ", inline: field.inline };
            } else {
                return { name: field.name, value: field.value, inline: field.inline };
            }
        });

        const updatedEmbed = EmbedBuilder.from(currentEmbed).setTitle("📚 Devoir ajouté").setDescription("Devoir ajouté!").setFields(updatedFields);

        await interaction.reply({ embeds: [updatedEmbed], flags: MessageFlags.Ephemeral });
    } catch (err) {
        const errorEmbed = new EmbedBuilder().setTitle('Erreur').setDescription("Erreur lors de l'ajout du devoir.").setColor(0xe74c3c);
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }
});

export default addDevoirModal;
