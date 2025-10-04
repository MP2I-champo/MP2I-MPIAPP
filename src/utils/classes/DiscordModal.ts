import { ModalBuilder, ModalSubmitInteraction } from 'discord.js';

class DiscordModal {
    public modal: ModalBuilder;
    // TRUE = startswith, FALSE = equals
    public startsWithOrEqual: boolean;
    public execute: (interaction: ModalSubmitInteraction) => Promise<void>;

    constructor(modal: ModalBuilder, startsWithOrEqual: boolean, execute: (interaction: ModalSubmitInteraction) => Promise<void>) {
        this.modal = modal;
        this.startsWithOrEqual = startsWithOrEqual;
        this.execute = execute;
    }
}

export default DiscordModal;
