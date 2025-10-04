import { EmbedBuilder, ButtonBuilder, ActionRowBuilder } from 'discord.js';
import Devoirs from '../database/models/Devoirs.js';
import addWorkButton from '../interactions/buttons/addWork.js';
import { DateTime } from 'luxon';
import MessageId from '../database/models/MessageId.js';
import params from '../../params.json' with { type: 'json' };
import client from '../client.js';

class DevoirsManager {
    private messageId: string | null = null;
    private channelId: string | null = params.channels.devoirs;
    private guild: any = null;

    public async init() {
        const channel = client.channels.cache.get(this.channelId!);
        if (!channel || !channel.isTextBased()) return;
        this.guild = (channel as any).guild;
        const dbEntry = await MessageId.findOne({ where: { name: 'devoirs' } });
        if (dbEntry && dbEntry.messageId) {
            this.messageId = dbEntry.messageId;
        }

        this.scheduleDailyUpdate();
    }

    async displayDevoirs() {
        const channel = client.channels.cache.get(this.channelId!);
        if (!channel || !channel.isTextBased()) return;
        this.guild = (channel as any).guild;
        if (!this.messageId) {
            const dbEntry = await MessageId.findOne({ where: { name: 'devoirs' } });
            if (dbEntry && dbEntry.messageId) {
                this.messageId = dbEntry.messageId;
            }
        }
        const devoirs = await this.getCurrentDevoirs();
        const embed = this.buildEmbed(devoirs);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addWorkButton.button);
        const sent = await (channel as any).send({ embeds: [embed], components: [row] });
        this.messageId = sent.id;
        await MessageId.upsert({ name: 'devoirs', messageId: sent.id });
    }

    async updateDevoirs() {
        if (!this.channelId || !this.messageId || !this.guild) return;
        const channel = await this.guild.channels.fetch(this.channelId!);
        if (!channel || !channel.isTextBased()) return;

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
        try {
            const message = await (channel as any).messages.fetch(this.messageId);
            await message.edit({ embeds: [embed], components: [row] });
        } catch {
            await this.displayDevoirs();
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
        if (devoirs.length === 0) {
            embed.setDescription('Aucun devoir à faire.');
        } else {
            devoirs.forEach((d) => {
                embed.addFields({
                    name: `${d.type} - ${d.dueTimestamp}`,
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
