import { Events } from 'discord.js';

export const name = Events.Error;
export const once = false;
export function execute(error: unknown): void {
    throw error;
}
