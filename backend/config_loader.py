import os
import configparser

def load_config(CONFIG_FILE_PATH):
    config_path = CONFIG_FILE_PATH or os.getenv("CONFIG_FILE_PATH")

    if not config_path or not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    config = configparser.ConfigParser()
    config.read(config_path)
    config_dict = {section: dict(config[section]) for section in config.sections()}

    return config_dict
