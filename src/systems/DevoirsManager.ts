import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, TextChannel } from 'discord.js';
import Devoirs from '../database/models/Devoirs.js';
import addWorkButton from '../interactions/buttons/addWork.js';
import { DateTime } from 'luxon';
import MessageId from '../database/models/MessageId.js';
import params from '../../params.json' with { type: 'json' };
import client from '../client.js';
import logger from '../utils/logger.js';

class DevoirsManager {
    private messageId: string | null = null;
    private channelId: string | null = params.channels.devoirs;
    private guild: any = null;

    public async init() {
        logger.info('DevoirsManager: Initializing...');
        const channel = client.channels.cache.get(this.channelId!) as TextChannel;
        this.guild = channel.guild;

        await this.updateDevoirs();
        this.scheduleDailyUpdate();
        logger.info('DevoirsManager: Initialized.');
    }

    async updateDevoirs() {
        if (!this.channelId || !this.guild) return;

        if (!this.messageId) {
            const dbEntry = await MessageId.findOne({ where: { name: 'devoirs' } });
        
            if (dbEntry && dbEntry.messageId) {
                this.messageId = dbEntry.messageId;
            }   
        }

        const channel = await this.guild.channels.fetch(this.channelId!) as TextChannel;

        const now = DateTime.now().setZone('Europe/Paris');
        const allDevoirs = await Devoirs.findAll();
        for (const d of allDevoirs) {
            const due = DateTime.fromFormat(d.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
            if (due.plus({ hours: 17 }) <= now) {
                await d.destroy();
            }
        }

        const devoirs = await this.getCurrentDevoirs();
        const embed = this.buildEmbed(devoirs);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addWorkButton.button);

        if (this.messageId) {
            try {
                const message = await channel.messages.fetch(this.messageId);
                await message.edit({ embeds: [embed], components: [row] });
                logger.info(`DevoirsManager: Edited devoirs message (${this.messageId})`);
            } catch {
                const sent = await channel.send({ embeds: [embed], components: [row] });
                this.messageId = sent.id;
                await MessageId.upsert({ name: 'devoirs', messageId: sent.id });
                logger.info(`DevoirsManager: Sent new devoirs message (${sent.id}), old message not found in channel`);
            }
        } else {
            const sent = await channel.send({ embeds: [embed], components: [row] });
            this.messageId = sent.id;
            await MessageId.upsert({ name: 'devoirs', messageId: sent.id });
            logger.info(`DevoirsManager: Sent new devoirs message (${sent.id}), old message not found in database`);

        }
    }

    async getCurrentDevoirs() {
        const now = DateTime.now().setZone('Europe/Paris');
        const devoirs = await Devoirs.findAll();
        const filtered = devoirs.filter((d: any) => {
            const due = DateTime.fromFormat(d.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
            return due.plus({ hours: 17 }).diff(now, 'hours').hours >= 0;
        });

        filtered.sort((a: any, b: any) => {
            const dueA = DateTime.fromFormat(a.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
            const dueB = DateTime.fromFormat(b.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
            return dueA.toMillis() - dueB.toMillis();
        });
        return filtered;
    }

    buildEmbed(devoirs: any[]) {
        const embed = new EmbedBuilder().setTitle('Devoirs à faire').setColor(0x3498db);
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        if (devoirs.length === 0) {
            embed.setDescription('Aucun devoir à faire.');
        } else {
            devoirs.forEach((d) => {
                const due = DateTime.fromFormat(d.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
                const unix = Math.floor(due.toSeconds());
                const dayName = daysFr[due.weekday % 7];

                embed.addFields({
                    name: `${d.type} - ${dayName} <t:${unix}:D>`,
                    value: d.description,
                    inline: false,
                });
            });
        }
        return embed;
    }

    scheduleDailyUpdate() {
        const now = DateTime.now().setZone('Europe/Paris');
        let nextUpdate = now.set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
        if (now > nextUpdate) nextUpdate = nextUpdate.plus({ days: 1 });
        const msUntilNext = nextUpdate.diff(now).as('milliseconds');
        setTimeout(() => {
            this.updateDevoirs();
            this.scheduleDailyUpdate();
        }, msUntilNext);
    }
}

export default new DevoirsManager();
