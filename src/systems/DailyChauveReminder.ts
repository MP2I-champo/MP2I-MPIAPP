import { TextChannel } from 'discord.js';
import params from '../../params.json' with { type: 'json' };
import client from '../client.js';
import logger from '../utils/logger.js';

class DailyChauveReminder {
    public init() {
        setInterval(async () => {
            await this.sendReminder();
        }, 24 * 60 * 60 * 1000);

        logger.info('Daily chauve reminder initialized.');
    }

    private async sendReminder() {
        const channelId = params.channels.chauve;
        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (channel && channel.isTextBased()) {
            await channel.send(`Daily chauve reminder: ${params.emojis.chauve}`);
            await channel.send(`<:chauve_fuck:${params.emojis.chauve}>`);
        }
    }
}

export default new DailyChauveReminder();
