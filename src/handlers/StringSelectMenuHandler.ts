import { Interaction } from 'discord.js';
import DiscordStringSelectMenu from '../utils/classes/DiscordStringSelectMenu.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

class StringSelectMenuHandler {
	private stringSelectMenus: DiscordStringSelectMenu[] = [];

	public async registerStringSelectMenus(): Promise<void> {
		const stringSelectMenuFolder = path.join(process.cwd(), 'dist', 'interactions', 'stringSelectMenus');
		const stringSelectMenuFiles = fs.readdirSync(stringSelectMenuFolder).filter((file) => file.endsWith('.js'));
		for (const file of stringSelectMenuFiles) {
			const filePath = path.join(stringSelectMenuFolder, file);
			const stringSelectMenu = await import(`file://${filePath}`);
			if (stringSelectMenu.default instanceof DiscordStringSelectMenu) {
				this.stringSelectMenus.push(stringSelectMenu.default);
			} else {
				logger.error(`The file ${filePath} does not export a valid DiscordStringSelectMenu instance.`);
			}
		}
		logger.info(`Successfully registered ${this.stringSelectMenus.length} string select menus.`);
	}

	public async handleInteraction(interaction: Interaction): Promise<void> {
		if (!interaction.isStringSelectMenu()) return;

		const customId = interaction.customId;
		for (const stringSelectMenu of this.stringSelectMenus) {
			const stringSelectMenuCustomId = stringSelectMenu.stringSelectMenu.data.custom_id || 'null';
			if ((stringSelectMenu.startsWithOrEqual && customId.startsWith(stringSelectMenuCustomId)) || (!stringSelectMenu.startsWithOrEqual && customId === stringSelectMenuCustomId)) {
				await stringSelectMenu.execute(interaction);
				return;
			}
		}
		logger.warn(`No string select menu found for customId: ${customId}`);
	}
}

export default new StringSelectMenuHandler();
