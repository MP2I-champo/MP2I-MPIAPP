import { ButtonBuilder, ButtonInteraction } from 'discord.js';

class DiscordButton {
    public button: ButtonBuilder;
    // TRUE = startswith, FALSE = equals
    public startsWithOrEqual: boolean;
    public execute: (interaction: ButtonInteraction) => Promise<void>;

    constructor(button: ButtonBuilder, startsWithOrEqual: boolean, execute: (interaction: ButtonInteraction) => Promise<void>) {
        this.button = button;
        this.startsWithOrEqual = startsWithOrEqual;
        this.execute = execute;
    }
}

export default DiscordButton;
