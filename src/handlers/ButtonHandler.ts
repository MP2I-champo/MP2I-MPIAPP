import { APIButtonComponentWithCustomId, Interaction } from 'discord.js';
import DiscordButton from '../utils/classes/DiscordButton.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

class ButtonHandler {
    private buttons: DiscordButton[] = [];

    public async registerButtons(): Promise<void> {
        const buttonFolder = path.join(process.cwd(), 'dist', 'interactions', 'buttons');
        const buttonFiles = fs.readdirSync(buttonFolder).filter((file) => file.endsWith('.js'));
        for (const file of buttonFiles) {
            const filePath = path.join(buttonFolder, file);
            const button = await import(`file://${filePath}`);
            if (button.default instanceof DiscordButton) {
                this.buttons.push(button.default);
            } else {
                logger.error(`The file ${filePath} does not export a valid DiscordButton instance.`);
            }
        }
        logger.info(`Successfully registered ${this.buttons.length} buttons.`);
    }

    public async handleInteraction(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;
        for (const button of this.buttons) {
            const buttonData = button.button.data as APIButtonComponentWithCustomId;
            const buttonCustomId = buttonData.custom_id || 'null';
            if ((button.startsWithOrEqual && customId.startsWith(buttonCustomId)) || (!button.startsWithOrEqual && customId === buttonCustomId)) {
                await button.execute(interaction);
                return;
            }
        }
        logger.warn(`No button found for customId: ${customId}`);
    }
}

export default new ButtonHandler();
