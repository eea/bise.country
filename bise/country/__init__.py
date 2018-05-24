# -*- extra stuff goes here -*-
from Products.Five.browser import BrowserView
from Products.CMFCore.utils import getToolByName


def initialize(context):
    """Initializer called when used as a Zope 2 product."""


class ForceUnlock(BrowserView):
    """Forcefully unlock a content item"""

    def __call__(self):
        annot = getattr(self.context, '__annotations__', {})

        if hasattr(self.context, '_dav_writelocks'):
            del self.context._dav_writelocks
            self.context._p_changed = True

        if 'plone.locking' in annot:
            del annot['plone.locking']

            self.context._p_changed = True
            annot._p_changed = True

        url = self.context.absolute_url()
        props_tool = getToolByName(self.context, 'portal_properties')

        if props_tool:
            types_use_view = \
                props_tool.site_properties.typesUseViewActionInListings

            if self.context.portal_type in types_use_view:
                url += '/view'

        return self.request.RESPONSE.redirect(url)
