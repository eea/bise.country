import json

from lxml.builder import E
from lxml.html import fromstring, tostring

from plone.api.user import has_permission
from plone.subrequest import subrequest


class MapFolderListingSettings(object):
    """
    """

    def __call__(self):
        res = {
            'filteredCountries': [
                {
                    "title": 'All countries',
                    "color": "red",
                    "countries": [x.Title()
                                  for x in self.context.listFolderContents()]
                }
            ],
            "maplets": "Malta,Luxembourg,Cyprus",
            "nonEuMembers": ["Albania", "Bosnia and Herzegovina", "Norway", "Turkey", "Republic of Serbia", "Montenegro", "Kosovo", "Switzerland", "Macedonia"]
        }

        self.request.response.headers['Content-Type'] = 'application/json'

        return json.dumps(res)


class MapSingleCountrySettings(object):
    """
    """

    def __call__(self):
        title = self.context.Title()
        res = {
            'filteredCountries': [
                {
                    "title": title,
                    "color": "red",
                    "countries": [title]
                }
            ],
            "maplets": ""
        }

        self.request.response.headers['Content-Type'] = 'application/json'

        return json.dumps(res)


class CountryFactsheetView(object):
    """
    """

    def can_edit(self, obj):
        return has_permission('Modify portal content', obj=obj)

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

        classes = e.xpath('//body')[0].get('class')
        ptype = [x for x in classes.split(' ') if x.startswith('portaltype-')]
        ptype = ptype and ptype[0] or ''

        root = E('div')

        if ptype:
            root.set('class', ptype)

        for node in nodes:
            root.append(node)
        content = tostring(root, pretty_print=True)

        if al:
            self.request.set('ajax_load', al)

        return content

    def dropdown_countries(self):
        parent = self.context.aq_parent
        children = parent.getFolderContents(
            contentFilter={'portal_type': 'countryfactsheet'}
        )
        ignore = self.context.id
        results = []

        for brain in children:
            if brain.id != ignore:
                results.append({'name': brain.Title,
                                'href': brain.getURL()})

        return results
