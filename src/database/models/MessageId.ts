import { Model, DataTypes, InferAttributes } from 'sequelize';
import sequelize from '../database.js';

class MessageId extends Model<InferAttributes<MessageId>> {
    declare name: string;
    declare messageId: string;
}

MessageId.init(
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        messageId: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        tableName: 'message_id',
    }
);

export default MessageId;
