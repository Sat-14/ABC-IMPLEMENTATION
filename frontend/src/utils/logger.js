const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

const CURRENT_LEVEL = import.meta.env.MODE === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

class Logger {
    static debug(message, ...args) {
        if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    static info(message, ...args) {
        if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    static warn(message, ...args) {
        if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    static error(message, ...args) {
        if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }

    static group(label) {
        if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
            console.group(label);
        }
    }

    static groupEnd() {
        if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
            console.groupEnd();
        }
    }
}

export default Logger;
