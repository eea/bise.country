import json

from lxml.builder import E
from lxml.html import fromstring, tostring
from plone.app.contentlisting.interfaces import (IContentListing,
                                                 IContentListingObject)
from Acquisition import aq_inner
from plone.api.user import has_permission
from plone.subrequest import subrequest

NONEU = [
    "Albania",
    "Bosnia and Herzegovina",
    "Norway",
    "Turkey",
    "Republic of Serbia",
    "Montenegro",
    "Kosovo",
    "Switzerland",
    "Macedonia",
]

MAPLETS = [
    "Malta",
    "Luxembourg",
    "Cyprus"
]


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
            "maplets": ','.join(MAPLETS),
            "nonEuMembers": NONEU,
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
            "maplets": "",
            "nonEuMembers": ""
        }

        self.request.response.headers['Content-Type'] = 'application/json'

        return json.dumps(res)


class CountryFactsheetView(object):
    """
    """
    def facts(self):
        context = aq_inner(self.context)
        sections = context.getFolderContents({'portal_type': 'Section'})
        fact_data = []

        targets = self.request.form.get('targets', '')

        for section in sections:
            data = {}
            data['object'] = IContentListingObject(section)
            section_object = data['object'].getObject()
            facts = section_object.getFolderContents({'portal_type': 'Fact'})
            fact_list = []

            if targets == "":
                fact_list = facts
                data['facts'] = IContentListing(fact_list)
                fact_data.append(data)
            else:
                if section_object.Title() == "General information":
                    fact_list = facts
                    data['facts'] = IContentListing(fact_list)
                    fact_data.append(data)
                else:
                    for fact in facts:
                        targetsArray = targets.split(",")

                        if fact.getObject().targets is not None:
                            for target in targetsArray:
                                if target in fact.getObject().targets:
                                    fact_list.append(fact)

                    if len(fact_list) > 0:
                        data['facts'] = IContentListing(fact_list)
                        fact_data.append(data)

        return fact_data

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
