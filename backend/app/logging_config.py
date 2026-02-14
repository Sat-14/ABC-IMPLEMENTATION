import os
import logging
from logging.config import dictConfig

def configure_logging(app):
    """
    Configures logging for the Flask application.
    """
    if not os.path.exists('logs'):
        os.mkdir('logs')

    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'default': {
                'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
            },
            'detailed': {
                'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(funcName)s: %(message)s',
            },
        },
        'handlers': {
            'wsgi': {
                'class': 'logging.StreamHandler',
                'stream': 'ext://flask.logging.wsgi_errors_stream',
                'formatter': 'default'
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': 'logs/app.log',
                'maxBytes': 1024 * 1024 * 10,  # 10 MB
                'backupCount': 5,
                'formatter': 'detailed',
                'level': 'DEBUG',
            },
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'detailed',
                'level': 'DEBUG',
            }
        },
        'root': {
            'level': 'INFO',
            'handlers': ['wsgi', 'file', 'console']
        },
        'loggers': {
            'app': {
                'level': 'DEBUG',
                'handlers': ['file', 'console'],
                'propagate': False
            },
            # Add other loggers if needed
        }
    }

    dictConfig(logging_config)
    
    # Set the log level for the app logger
    app.logger.setLevel(logging.DEBUG)
    
    # Add handlers to app.logger explicitly to ensure they are used
    # This might be redundant with dictConfig root/loggers setup but ensures Flask app.logger works as expected
    for handler_name in ['file', 'console']:
        handler = logging.getHandlerByName(handler_name)
        if handler:
             app.logger.addHandler(handler)

    app.logger.info("Logging configured successfully.")
