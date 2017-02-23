from AccessControl.PermissionMapping import getPermissionMapping
from Products.CMFPlone.utils import getToolByName
from Products.DCWorkflow.utils import modifyRolesForPermission
from bise.country.interfaces import ICountryFolder
from plone.dexterity.utils import createContentInContainer
from zope.interface import alsoProvides
import logging

logger = logging.getLogger('bise.country')


def setup_country_folder(folder):
    """ Setup the container for country folders
    """

    logger.info("Grant Add permission on /checkout-folder")

    countries = [x for x in folder.contentValues()
                 if x.portal_type == 'FolderishPage']

    for obj in countries:
        logger.info("Applying ICountryFolder marker interface to %s",
                    obj.absolute_url())
        alsoProvides(obj, ICountryFolder)

    logger.info("Set placeful workflow policy for /countries")
    tool = getToolByName(folder, 'portal_placeful_workflow')
    config = tool.getWorkflowPolicyConfig(folder)

    # NOTE: updates workflow mappings
    config.setPolicyBelow('countries_checkout_workflow', True)


def initialize_bise_checkout(context):
    """ A GenericSetup import handler.
    """

    if context.readDataFile('bise.country.txt') is None:
        return

    site = context.getSite()

    # create checkout-folder
    # assign ICountryFolder to folders in /countries

    cf = createContentInContainer(site, 'Folder', title='Checkout folder')
    logger.info("Created /checkout-folder")

    # We grant "Add portal content" permission on the checkout-folder
    perm = 'Add portal content'
    pm = set(getPermissionMapping(perm, cf, st=tuple))
    pm.update(['Contributor', 'Reviewer', 'Editor', 'Manager', 'Owner'])
    modifyRolesForPermission(cf, perm, tuple(pm))

    for name in ['countries']:
        setup_country_folder(site.restrictedTraverse(name))
