from bise.country.factsheet import CountryFactsheet
from plone.app.iterate.dexterity.utils import get_baseline
from plone.app.iterate.event import WorkingCopyDeletedEvent
from zExceptions import Redirect
from zope.event import notify
import logging
import transaction


logger = logging.getLogger("bise.country.events")


def handle_checkout_event(event):
    """ Copy local roles from baseline to wc
    """
    original = event.object
    wc = event.working_copy
    # {
    # 'admin': ['Owner'],
    # 'tibi_countryrep': [u'Contributor', u'Reader'],
    # 'tibi_eea_rep': [u'Reviewer', u'Reader'],
    # 'tibi_etc_rep': [u'Editor', u'Reader']
    # }
    # copy all local roles, but filter out local roles

    logger.info("Copying local roles from original to working copy")

    for user, roles in original.__ac_local_roles__.items():
        roles = [r for r in roles if r != 'Owner']
        if roles:
            ex = wc.__ac_local_roles__.get(user, [])
            roles = list(set(roles + ex))
            wc.__ac_local_roles__[user] = roles
            wc._p_changed = True

    # We grant "Delete objects" permission on the wc, to Contributor, to allow
    # canceling checkouts
    # perm = 'Delete objects'
    # from Products.DCWorkflow.utils import modifyRolesForPermission
    # from AccessControl.PermissionMapping import getPermissionMapping
    # pm = set(getPermissionMapping(perm, wc, st=tuple))
    # pm.add('Contributor')
    # pm.add('Owner')
    # modifyRolesForPermission(wc, perm, tuple(pm))


def handle_iterate_wc_deletion(object, event):
    """ When a WorkingCopy is deleted, the problem was that the locking was not
    removed. We're manually triggering the IWorkingCopyDeletedEvent because
    the plone.app.iterate handler is registered for IWorkingCopyRelation, a
    derivate of Archetype's relations, which is not used in the dexterity
    implementation.
    """
    try:
        baseline = get_baseline(object)
    except:
        return
    notify(WorkingCopyDeletedEvent(object, baseline, relation=None))


def handle_facts_edit_event(object, event):
    """ Redirect to countryfactsheet when editing Facts """
    for obj in object.REQUEST.PARENTS:
        c_name = getattr(obj, 'fact_countryName', None)
        if c_name:
            c_id = obj.getId()
            if c_name.lower().replace(' ', '-') == c_id:
                path = '/'.join(['countries', c_id])
                cf = obj.restrictedTraverse(path, None)
                if cf and path in cf.absolute_url():
                    transaction.commit()
                    raise Redirect(cf.absolute_url())
