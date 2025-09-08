import { Events, Interaction } from 'discord.js';
import logger from '../utils/logger.js';
import { ExtendedClient } from '../client.js';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
        const client = interaction.client as ExtendedClient;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
    } else {
        logger.warn(`Unhandled interaction type: ${interaction.type}`);
    }
}
