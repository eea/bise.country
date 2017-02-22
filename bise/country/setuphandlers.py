from AccessControl.PermissionMapping import getPermissionMapping
from Products.DCWorkflow.utils import modifyRolesForPermission
from bise.country.interfaces import ICountryFolder
from plone.dexterity.utils import createContentInContainer
from zope.interface import alsoProvides
import logging

logger = logging.getLogger('bise.country')


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

    logger.info("Grant Add permission on /checkout-folder")

    country = site['countries']
    for obj in country.contentValues():
        if obj.portal_type == 'FolderishPage':
            alsoProvides(obj, ICountryFolder)
