from plone.api.user import get_roles
from plone.app.contentmenu.menu import ActionsSubMenuItem as ASMI
from plone.app.contentmenu.menu import FactoriesSubMenuItem as FSMI
from plone.app.layout.globals.context import ContextState as CS


class FactoriesSubMenuItem(FSMI):

    def available(self):
        local_roles = get_roles(obj=self.context, inherit=True)
        # hide Factories menu for Contributor
        return 'Contributor' not in local_roles


class ActionsSubMenuItem(ASMI):

    def available(self):
        local_roles = get_roles(obj=self.context, inherit=True)
        # hide Actions menu for Contributor
        return 'Contributor' not in local_roles


class ContextState(CS):
    """ Override @@plone_context_state to only allow View/Edit actions
    """

    def actions(self, category=None, max=-1):
        actions = super(ContextState, self).actions(category=category, max=max)
        views = ['view', 'edit', 'country_checkout_share']
        if category == 'object':
            actions = [a for a in actions if a['id'] in views]
        return actions
