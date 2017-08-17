""" Country Header tile
"""

from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from collective.cover import _
from collective.cover.tiles.base import IPersistentCoverTile
from collective.cover.tiles.base import PersistentCoverTile
from lxml.html import fromstring, tostring
from plone.app.uuid.utils import uuidToObject
from plone.autoform.directives import write_permission
from plone.formwidget.contenttree import UUIDSourceBinder
from plone.subrequest import subrequest
from z3c.relationfield.schema import RelationList, RelationChoice
from zope import schema
from zope.interface import implementer


class ICountryHeaderTile(IPersistentCoverTile):

    title = schema.TextLine(
        title=_(u'Country name'),
        required=False,
    )

    write_permission(embed='collective.cover.EmbedCode')
    embed = schema.Text(
        title=_(u'Map Embedding code'),
        required=False,
    )

    uuid = RelationList(
        title=u"Linked objects",
        value_type=RelationChoice(
            title=u"Linked object",
            source=UUIDSourceBinder(),
            required=False,
        )
    )


@implementer(ICountryHeaderTile)
class CountryHeaderTile(PersistentCoverTile):

    index = ViewPageTemplateFile('pt/countryheader.pt')

    is_configurable = True
    is_editable = True
    is_droppable = False
    short_name = default = u'Country Header'

    def is_empty(self):
        return not (self.data.get('embed', None) or
                    self.data.get('title', None))

    def accepted_ct(self):
        """Return an empty list as no content types are accepted."""
        return []

    def tabs(self):
        tabs = []
        uuids = self.data.get('uuid') or []
        for uuid in uuids:
            obj = uuidToObject(uuid)
            tabs.append(obj)
        return tabs

    def view_page(self, obj):
        al = self.request.get('ajax_load')
        self.request.set('ajax_load', True)
        path = '/'.join(obj.getPhysicalPath())
        resp = subrequest(path)
        body = resp.getBody()
        e = fromstring(body)
        nodes = e.cssselect("#content-core > *")
        if not nodes:
            nodes = e.cssselect("#content > *")

        # TODO: make sure about unicode compatibility
        cn = [tostring(node) for node in nodes]
        content = "\n".join(cn)
        if al:
            self.request.set('ajax_load', al)
        return content

    def dropdown_countries(self):
        parent = self.context.aq_parent
        children = parent.listFolderContents()

        ignore = ['gi', 'eu_country_profiles', 'Map_Countries.png',
                  self.context.id]

        results = []
        for child in children:
            if child.id not in ignore:
                results.append({'name': child.title,
                                'href': child.absolute_url()})

        return results
