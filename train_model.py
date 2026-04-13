from models.train_model import train_system_models


if __name__ == "__main__":
    # Default root trainer now targets DMRC to preserve existing behavior.
    print(train_system_models(system="DMRC"))
