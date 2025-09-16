import logger from '../utils/logger.js';
import sequelize from './database.js';
import Devoirs from './models/Devoirs';
import MessageId from './models/MessageId';

async function initDatabase() {
    try {
        await sequelize.authenticate();
        logger.info(`Connected with the database successfully.`);

        await MessageId.sync();
        await Devoirs.sync();
    } catch (error) {
        logger.error(`Unable to connect to the database:`, error);
    }
}

export default initDatabase;
