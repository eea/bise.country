import json
import logging

from lxml.builder import E
from lxml.html import fromstring, tostring

from Acquisition import aq_inner
from bise.country.interfaces import ICountryPage
from plone import api
from plone.api.user import has_permission
from plone.app.contentlisting.interfaces import (IContentListing,
                                                 IContentListingObject)
from plone.memoize import view
from plone.subrequest import subrequest
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

logger = logging.getLogger('bise.country.views')

NONEU = [
    "Albania",
    "Bosnia and Herzegovina",
    "Norway",
    "Turkey",
    "Republic of Serbia",
    "Montenegro",
    "Kosovo",
    "Serbia",
    "Switzerland",
    "Former Yugoslav Republic of Macedonia",
    "Liechtenstein",
    "Iceland"
]

MAPLETS = [
    "Malta",
    "Luxembourg",
    "Cyprus",
    "Liechtenstein",
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


class CountriesSection(object):
    """ View for the countries section
    """

    _tabs = (
        ('Countries',
         None,
         'all-countries general-eu-map',
         'Action Plan Report'
         ),
        ('Factsheets',
         'countries/eu_country_profiles',
         'eu-countries general-eu-map',
         'Biodiversity factsheets for EU Members',
         ),
        ('Contributions',
         'mtr/countries',
         'eu-countries general-eu-map',
         'EU Member States contribution to the mid-term review.'),
        ('MAES',
         'maes/maes_countries',
         'maes-eu-map',
         'MAES-related developments in the European Union'),
        ('Green Infrastructure',
         'countries/gi',
         'eu-countries general-eu-map',
         'GI-related developments in the European Union'),
    )

    @view.memoize
    def tabs(self):
        portal = api.portal.get()
        res = []

        for label, path, klass, desc in self._tabs:
            if path is None:
                obj = self.context
            else:
                obj = portal.restrictedTraverse(path)
            res.append({
                'label': label,
                'obj': obj,
                'class': klass,
                'description': desc
            })

        return res

    def get_country_pages(self, obj):
        # 'review_state': 'published'
        brains = obj.getFolderContents(contentFilter={'sort_on': 'getId', })
        objs = [b.getObject() for b in brains]
        objs = [o for o in objs if ICountryPage.providedBy(o)]

        return objs


class CountryFactsheetView(object):
    """ Main index page for a countryfactsheet content type
    """

    sections_template = ViewPageTemplateFile('pt/countryfactsheet_sections.pt')

    _tab_labels = (
        (
            'Country Overview',
            None,
            ' '
        ),
        (
            'EU Nature Directives',
            'countries/nature-directives',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page'
        ),
        (
            'EU Biodiversity Strategy',
            'mtr/countries',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page'
        ),
        (
            'MAES',
            'maes/maes_countries',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page'
        ),
        (
            'Green Infrastructure',
            'countries/gi',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page'
        )
    )

    def tabs(self):
        portal = api.portal.get()

        tabs = []

        country_id = self.context.getId()

        for label, location, description in self._tab_labels:
            if not location:
                tabs.append((label, self.context))

                continue
            path = location + '/' + country_id
            try:
                dest = portal.restrictedTraverse(path)
            except Exception:
                logger.warning("Could not find path: %s", path)

                continue
            else:
                tabs.append((label, dest, description))

        return tabs

    def facts(self):
        # TODO: should make this a function in bise.biodiversityfactsheet
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
        if obj is self.context:
            return self.sections_template()

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
                obj = brain.getObject()

                if not ICountryPage.providedBy(obj):
                    continue
                results.append({'name': brain.Title,
                                'href': brain.getURL()})

        return results
