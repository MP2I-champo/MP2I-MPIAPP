import { Client, Events } from 'discord.js';
import logger from '../utils/logger.js';
import DailyChauveReminder from '../systems/DailyChauveReminder.js';
import EmploiDuTemps from '../systems/EmploiDuTemps.js';

export const name = Events.ClientReady;
export const once = true;
export async function execute(client: Client) {
    if (!client.user) return logger.error('Client user is undefined');

    logger.info(`Logged to discord as ${client.user.tag}`);

    DailyChauveReminder.init();
    await EmploiDuTemps.init();
}
