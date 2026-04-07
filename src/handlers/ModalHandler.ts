import { Interaction } from 'discord.js';
import DiscordModal from '../utils/classes/DiscordModal.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

class ModalHandler {
	private modals: DiscordModal[] = [];

	public async registerModals(): Promise<void> {
		const modalFolder = path.join(process.cwd(), 'dist', 'interactions', 'modals');
		const modalFiles = fs.readdirSync(modalFolder).filter((file) => file.endsWith('.js'));
		for (const file of modalFiles) {
			const filePath = path.join(modalFolder, file);
			const modal = await import(`file://${filePath}`);
			if (modal.default instanceof DiscordModal) {
				this.modals.push(modal.default);
			} else {
				logger.error(`The file ${filePath} does not export a valid DiscordModal instance.`);
			}
		}
		logger.info(`Successfully registered ${this.modals.length} modals.`);
	}

	public async handleInteraction(interaction: Interaction): Promise<void> {
		if (!interaction.isModalSubmit()) return;

		const customId = interaction.customId;
		for (const modal of this.modals) {
			const modalCustomId = modal.modal.data.custom_id || 'null';
			if ((modal.startsWithOrEqual && customId.startsWith(modalCustomId)) || (!modal.startsWithOrEqual && customId === modalCustomId)) {
				await modal.execute(interaction);
				return;
			}
		}
		logger.warn(`No modal found for customId: ${customId}`);
	}
}

export default new ModalHandler();
