import { Collection } from 'discord.js';
import logger from './utils/logger.js';
import client from './client.js';

logger.info('Starting the application...');

client.commands = new Collection();
client.connect();
