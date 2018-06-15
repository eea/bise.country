from logging import getLogger

PROFILE_ID = 'profile-bise.country:default'


def upgrade_to_1002(context, logger=None):
    if logger is None:
        logger = getLogger('upgrade_to_1002')
    logger.info("Starting upgrade.")
    context.runImportStepFromProfile(PROFILE_ID, 'repositorytool')
    context.runImportStepFromProfile(PROFILE_ID, 'workflow')
    logger.info("Finished upgrade.")


def upgrade_to_1003(context, logger=None):
    if logger is None:
        logger = getLogger('upgrade_to_1003')
    logger.info('Starting upgrade')
    context.runImportStepFromProfile(PROFILE_ID, 'workflow')
    context.runImportStepFromProfile(PROFILE_ID, 'placeful_workflow')
    logger.info('Finished upgrade')


def upgrade_to_1004(context, logger=None):
    if logger is None:
        logger = getLogger('upgrade_to_1004')
    logger.info('Starting upgrade')
    context.runImportStepFromProfile(PROFILE_ID, 'workflow')
    context.runImportStepFromProfile(PROFILE_ID, 'placeful_workflow')
    logger.info('Finished upgrade')
