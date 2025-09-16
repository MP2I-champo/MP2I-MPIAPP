import { Sequelize } from 'sequelize';
import pg from 'pg';

const sequelize = new Sequelize(process.env.DATABASE_NAME as string, process.env.DATABASE_USER as string, process.env.DATABASE_PASSWORD as string, {
    host: process.env.DATABASE_HOST as string,
    port: 5432,
    dialect: 'postgres',
    logging: false,
    dialectModule: pg,
});

export default sequelize;
