import { Model, DataTypes, InferAttributes } from 'sequelize';
import sequelize from '../database.js';

class Devoirs extends Model<InferAttributes<Devoirs>> {
    declare id?: number;
    declare description: string;
    declare type: string;
    declare dueTimestamp: string;
}

Devoirs.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING(4096),
        },
        dueTimestamp: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        tableName: 'devoir',
    }
);

export default Devoirs;
