import { ButtonBuilder, ActionRowBuilder, TextChannel, TextDisplayBuilder,SeparatorBuilder, ContainerBuilder, MessageFlags } from 'discord.js';
import Devoirs from '../database/models/Devoirs.js';
import addWorkButton from '../interactions/buttons/addWork.js';
import { DateTime } from 'luxon';
import MessageId from '../database/models/MessageId.js';
import params from '../../params.json' with { type: 'json' };
import client from '../client.js';
import logger from '../utils/logger.js';

class DevoirsManager {
    private messageId: string | null = null;
    private channelId: string = params.channels.devoirs;
    private guild: any = null;

    public async init() {
        logger.info('DevoirsManager: Initializing...');
        let channel = client.channels.cache.get(this.channelId) as TextChannel | null;
        if (!channel) {
            try {
                channel = (await client.channels.fetch(this.channelId)) as TextChannel | null;
            } catch (fetchErr) {
                logger.error(`DevoirsManager: Failed to fetch channel ${this.channelId}: ${String(fetchErr)}`);
                return;
            }
        }
	
	channel = channel as TextChannel;
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

        const channel = await this.guild.channels.fetch(this.channelId) as TextChannel;

        const now = DateTime.now().setZone('Europe/Paris');
        const allDevoirs = await Devoirs.findAll();
        for (const d of allDevoirs) {
            const due = DateTime.fromFormat(d.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
            if (due.plus({ hours: 17 }) <= now) {
                await d.destroy();
            }
        }

        const devoirs = await this.getCurrentDevoirs();
        const layoutComponents = this.buildMessage(devoirs);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(addWorkButton.button);

        const finalComponents = [...layoutComponents, row] as any[];

        if (this.messageId) {
            try {
                const message = await channel.messages.fetch(this.messageId);
                await message.edit({ components: finalComponents, flags : MessageFlags.IsComponentsV2});

                logger.info(`DevoirsManager: Edited devoirs message (${this.messageId})`);
            } catch {
                const sent = await channel.send({ components: finalComponents, flags : MessageFlags.IsComponentsV2});
                this.messageId = sent.id;

                await MessageId.upsert({ name: 'devoirs', messageId: sent.id });
                logger.info(`DevoirsManager: Sent new devoirs message (${sent.id}), old message not found in channel`);
            }
        } else {
            const sent = await channel.send({ components: finalComponents, flags : MessageFlags.IsComponentsV2});
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

    buildMessage(devoirs: any[]) {
        const components: any[] = [];

        const header = new TextDisplayBuilder()
            .setContent('# 📘 Devoirs à faire');
        components.push(header, new SeparatorBuilder());

        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

        if (devoirs.length === 0) {
            const emptyState = new TextDisplayBuilder()
                .setContent('*Aucun devoir à faire.*');
            components.push(emptyState);
            return components;
        }
        
        const container = new ContainerBuilder().setAccentColor(0x3498db);

        const groupedByDate = new Map<string, any[]>();
        for (const d of devoirs) {
            if (!groupedByDate.has(d.dueTimestamp)) {
                groupedByDate.set(d.dueTimestamp, []);
            }
            groupedByDate.get(d.dueTimestamp)!.push(d);
        }

        for (const [dateStr, tasksForDate] of groupedByDate.entries()) {
            const firstTask = tasksForDate[0];
            const due = DateTime.fromFormat(firstTask.dueTimestamp, 'dd/MM/yyyy', { zone: 'Europe/Paris' });
            const unix = Math.floor(due.toSeconds());
            const dayName = daysFr[due.weekday % 7];

            let dateSectionText = `## 📅 ${dayName} <t:${unix}:D>\n`;

            const groupedByMatiere = new Map<string, any[]>();
            for (const task of tasksForDate) {
                const matiere = task.type || 'Autre';
                if (!groupedByMatiere.has(matiere)) {
                    groupedByMatiere.set(matiere, []);
                }
                groupedByMatiere.get(matiere)!.push(task);
            }

            for (const [matiere, tasksForMatiere] of groupedByMatiere.entries()) {
                dateSectionText += `**${matiere}**\n`;
                for (const task of tasksForMatiere) {
                    dateSectionText += `> ${task.description.replaceAll("\n", "\n> ")}\n`;
                }
                dateSectionText += '\n\n';
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(dateSectionText.trim())
            );
        }

        components.push(container);
        
        return components;
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
