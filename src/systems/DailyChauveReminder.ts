import { TextChannel } from 'discord.js';
import params from '../../params.json' with { type: 'json' };
import client from '../client.js';
import logger from '../utils/logger.js';
import { DateTime } from 'luxon';

class DailyChauveReminder {
    private initialized: boolean = false;

    public async init() {
	if(!this.initialized) {	
            this.scheduleDailyReminder();
            logger.info('Daily chauve reminder initialized.');
	}
    }

    private scheduleDailyReminder() {
        const getMsUntilNext6Paris = () => {
            const nowParis = DateTime.now().setZone('Europe/Paris');
            let nextUpdate = nowParis.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
            if (nowParis >= nextUpdate) {
                nextUpdate = nextUpdate.plus({ days: 1 });
            }
            return nextUpdate.toMillis() - nowParis.toMillis();
        };

        const loop = async () => {
            await this.dailyReminder();
            setTimeout(loop, getMsUntilNext6Paris());
        };

        setTimeout(loop, getMsUntilNext6Paris());
    }

    private async dailyReminder() {
        const channelId = params.channels.chauve;
        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (!channel || !channel.isTextBased()) return;

        await channel.send(`Daily chauve reminder: ${params.emojis.chauve}`);
        await channel.send(params.emojis.chauve);
        logger.info('Daily chauve reminder sent.');
    }
}

export default new DailyChauveReminder();
