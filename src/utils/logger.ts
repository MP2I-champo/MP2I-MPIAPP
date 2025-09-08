import winston from 'winston';

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'MM-DD HH:mm' }),
    winston.format.printf((info: any) => {
        const level = String(info.level).toUpperCase();
        const timestamp = info.timestamp;
        const message = info.message;

        let colorNumber = 0;
        switch (info.level) {
            case 'error':
                colorNumber = 31; // red
                break;
            case 'warn':
                colorNumber = 33; // yellow
                break;
            case 'info':
                colorNumber = 32; // green
                break;
        }

        const levelColorCode = '\x1b[30m';
        const textColorCode = `\x1b[${colorNumber}m`;
        const backgroundColorCode = `\x1b[${colorNumber + 10}m`;

        return `${textColorCode}[${timestamp}]\x1b[0m ${levelColorCode + backgroundColorCode} ${level.toUpperCase()} \x1b[0m${textColorCode} : ${message}\x1b[0m`;
    })
);

const logger = winston.createLogger({
    levels: {
        error: 0,
        warn: 1,
        info: 2,
    },
    transports: [new winston.transports.Console({ format: consoleFormat })],
});

export default logger;
