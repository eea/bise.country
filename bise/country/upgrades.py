from logging import getLogger

PROFILE_ID = 'profile-bise.country:default'


def upgrade_to_1002(context, logger=None):
    if logger is None:
        logger = getLogger('upgrade_to_1002')
    logger.info("Starting upgrade.")
    context.runImportStepFromProfile(PROFILE_ID, 'repositorytool')
    context.runImportStepFromProfile(PROFILE_ID, 'workflow')
    logger.info("Finished upgrade.")
