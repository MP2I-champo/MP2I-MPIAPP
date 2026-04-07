import { GuildMember, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, EmbedBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import DiscordStringSelectMenu from '../../utils/classes/DiscordStringSelectMenu.js';
import { buildFreshHmwkModal } from '../modals/addWork.js'; 
import logger from '../../utils/logger.js';

export function buildFreshDateMenu(): StringSelectMenuBuilder {
    const options: StringSelectMenuOptionBuilder[] = [];
    let currentDate = DateTime.now().setZone('Europe/Paris');

    while (options.length < 25) {
        if (currentDate.weekday !== 6 && currentDate.weekday !== 7) {
            const rawLabel = currentDate.setLocale('fr').toFormat('cccc d LLLL');
            const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(label)
                    .setValue(currentDate.toFormat('dd/MM/yyyy')) 
            );
        }
        currentDate = currentDate.plus({ days: 1 });
    }

    return new StringSelectMenuBuilder()
        .setCustomId('select_hmwk_date') 
        .setPlaceholder('Choisissez une date...')
        .addOptions(options);
}

const infoEmbed = new EmbedBuilder()
    .setDescription('Veuillez remplir le formulaire.')
    .setColor(0x3498db);

const selectBadgeStringSelectMenu = new DiscordStringSelectMenu(
	new StringSelectMenuBuilder().setCustomId('select_hmwk_date'),
	false,
	async (interaction) => {
        const selectedDate = interaction.values[0];

        const currentEmbed = interaction.message.embeds[0];

        let currentType = currentEmbed?.fields.find(f => f.name === 'Matière')?.value || '';
        switch(currentType) {
            case `✅ **Autre**`:
                currentType = `Autre`;
                break;
            case `✅ **SI**`:
                currentType = `SI`;
                break;
            case `✅ **Info**`:
                currentType = `Info`;
                break;
            case `✅ **Maths**`:
                currentType = `Maths`;
                break;
            case `✅ **Physique**`: 
                currentType = `Physique`;
                break;
            case `✅ **Français**`:
                currentType = `Français`;
                break;
            case `✅ **Anglais**`:
                currentType = `Anglais`;
                break;
            default:
                break;
        }
       
       const modal = buildFreshHmwkModal(currentType, selectedDate);

       await interaction.showModal(modal);
	}
);

export default selectBadgeStringSelectMenu;
