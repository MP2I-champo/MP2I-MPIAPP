import { Client, Events } from 'discord.js';
import logger from '../utils/logger.js';
import dailyChauveReminder from '../systems/DailyChauveReminder.js';
import emploiDuTemps from '../systems/EmploiDuTemps.js';
import initDatabase from '../database/initDatabase.js';

export const name = Events.ClientReady;
export const once = true;
export async function execute(client: Client) {
    if (!client.user) return logger.error('Client user is undefined');

    logger.info(`Logged to discord as ${client.user.tag}`);

    await initDatabase();

    dailyChauveReminder.init();
    await emploiDuTemps.init();
}
