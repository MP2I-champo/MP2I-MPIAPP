import { StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';

class DiscordStringSelectMenu {
    public stringSelectMenu: StringSelectMenuBuilder;
    public startsWithOrEqual: boolean;
    public execute: (interaction: StringSelectMenuInteraction) => Promise<void>;

    constructor(stringSelectMenu: StringSelectMenuBuilder, startsWithOrEqual: boolean, execute: (interaction: StringSelectMenuInteraction) => Promise<void>) {
        this.stringSelectMenu = stringSelectMenu;
        this.startsWithOrEqual = startsWithOrEqual;
        this.execute = execute;
    }
}

export default DiscordStringSelectMenu;
