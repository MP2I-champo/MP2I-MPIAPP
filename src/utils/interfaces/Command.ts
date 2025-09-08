import { SlashCommandBuilder } from 'discord.js';

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: any) => Promise<void>;
}

export default Command;
