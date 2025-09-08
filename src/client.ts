import { Client, Collection } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Command from './utils/interfaces/Command.js';

class ExtendedClient extends Client {
    commands: Collection<string, Command>;
    connect: () => void;

    constructor() {
        super({ intents: 3276799 });
        this.commands = new Collection();
        this.connect = () => {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const eventsPath = path.join(__dirname, 'events');

            const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                import(filePath).then((event) => {
                    if (event.once) {
                        this.once(event.name, (...args) => event.execute(...args));
                    } else {
                        this.on(event.name, (...args) => event.execute(...args));
                    }
                });
            }

            this.login(process.env.DISCORD_TOKEN);
        };
    }
}

const client = new ExtendedClient();

export default client;

export { ExtendedClient };
