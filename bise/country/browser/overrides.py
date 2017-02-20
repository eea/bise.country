from plone.app.contentmenu.menu import ActionsSubMenuItem as ASMI
from plone.memoize.instance import memoize
from plone.api.user import get_roles


class ActionsSubMenuItem(ASMI):

    @memoize
    def available(self):
        local_roles = get_roles(obj=self.context, inherit=False)
        # hide Actions menu for Contributor
        return 'Contributor' not in local_roles
