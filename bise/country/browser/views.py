import json
import logging

from lxml.builder import E
from lxml.html import fromstring, tostring
from zope.component import getMultiAdapter

from AccessControl import getSecurityManager
from Acquisition import aq_inner
from bise.country.interfaces import ICountryPage
from plone import api
from plone.api.content import get_state
from plone.api.user import get_roles, has_permission, is_anonymous
from plone.app.contentlisting.interfaces import (IContentListing,
                                                 IContentListingObject)
from plone.app.iterate.interfaces import ICheckinCheckoutPolicy
from plone.app.layout.viewlets import ViewletBase
from plone.memoize import view
from plone.subrequest import subrequest
from Products.CMFCore.permissions import ModifyPortalContent
from Products.Five.browser import BrowserView
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
        ('Overview',
         None,
         'all-countries general-eu-map',
         'Action Plan Report'
         ),
        ('EU Nature Directives',
         'countries/eu_country_profiles',
         'eu-countries general-eu-map',
         'Biodiversity factsheets for EU Members',
         ),
        ('EU Biodiversity strategy',
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

    def can_edit(self, obj):
        if 'eu_country_profiles' in [obj.aq_parent.id, obj.id]:
            return False
        return has_permission('Modify portal content', obj=obj)


class CountryFactsheetView(object):
    """ Main index page for a countryfactsheet content type
    """

    sections_template = ViewPageTemplateFile('pt/countryfactsheet_sections.pt')

    _tab_labels = (
        (
            'Country Overview',
            None,
            ' ',
            '%s - Country Overview',
        ),
        (
            'EU Nature Directives',
            'countries/nature-directives',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page',
            'EU Nature Directives for %s',
        ),
        (
            'EU Biodiversity Strategy',
            'mtr/countries',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page',
            '%s - Contribution to the mid-term review of the EU biodiversity '
            'strategy to 2020 based on the 5th national report to CBD',
        ),
        (
            'MAES',
            'maes/maes_countries',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page',
            'MAES-related developments in %s',
        ),
        (
            'Green Infrastructure',
            'countries/gi',
            '- insert one sentence providing an overview of the information '
            'that can be found on this page',
            'Green Infrastructure in %s',
        )
    )

    def tabs(self):
        portal = api.portal.get()

        tabs = []

        country_id = self.context.getId()

        for label, location, description, tooltip in self._tab_labels:
            tooltip = tooltip % self.context.fact_countryName
            if not location:
                tabs.append((label, self.context, tooltip))

                continue
            path = location + '/' + country_id
            try:
                dest = portal.restrictedTraverse(path)
            except Exception:
                logger.warning("Could not find path: %s", path)

                continue
            else:
                if dest.get('nature-directives', None):
                    description = dest.get('nature-directives').description
                tabs.append((label, dest, description, tooltip))

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

                results.append({'name': brain.Title,
                                'href': brain.getURL()})

        return results

    def get_countries(self):
        countries = self.context.aq_parent.getFolderContents(
            contentFilter={'portal_type': 'countryfactsheet',
                           'sort_on': 'sortable_title',
                           'sort_order': 'ascending'}
        )
        results = []

        for brain in countries:
            obj = brain.getObject()

            if not ICountryPage.providedBy(obj):
                continue
            results.append({'name': brain.Title,
                            'href': brain.getURL()})

        return results


class CountryCheckoutView(BrowserView):
    """ Countries "checkout menu" viewlet
    """

    def state_labels(self):
        return {
            'draft': 'First draft',
            'country_draft': 'Country draft',
            'etc_review': 'Under review by ETC/EEA',
            'published': 'Published',
        }

    def is_contributor(self):
        local_roles = get_roles(obj=self.context, inherit=True)

        return 'Contributor' in local_roles

    def can_cancel(self):
        # contributor must have ModifyPortalContent permission

        sm = getSecurityManager()

        return self.has_checkout() and \
            sm.checkPermission(ModifyPortalContent, self.context)

    def has_checkout(self):
        policy = ICheckinCheckoutPolicy(self.context, None)

        if policy is None:
            return False

        wc = policy.getWorkingCopy()

        return wc is not None

    def can_checkout(self):
        # user is Contributer, state is published, context is baseline and
        # doesn't have a checkout

        # if self.context.portal_type == 'Document':
        #     import pdb; pdb.set_trace()
        local_roles = get_roles(obj=self.context, inherit=True)

        control = getMultiAdapter((self.context, self.request),
                                  name="iterate_control")

        # this happens if the context is not registered for @@iterate_control
        # for example, content types we don't care about

        if not hasattr(control, 'is_checkout'):
            return False

        policy = ICheckinCheckoutPolicy(self.context, None)

        if policy is None:
            return False

        wc = policy.getWorkingCopy()

        is_baseline = not control.is_checkout()
        is_published = get_state(self.context) == 'published'
        # is_country_draft = get_state(self.context) == 'country_draft'
        is_contributor = 'Contributor' in local_roles
        has_wc = wc is not None

        correct_state = is_published    # or is_country_draft

        return is_baseline \
            and correct_state \
            and is_contributor \
            and (not has_wc)

    def can_checkin(self):
        # user is Reviewer/Editor, state is submitted, context is wc

        local_roles = get_roles(obj=self.context, inherit=True)

        control = getMultiAdapter((self.context, self.request),
                                  name="iterate_control")

        if not hasattr(control, 'is_checkout'):
            return False
        is_wc = control.is_checkout()
        is_ready = get_state(self.context) == 'ready_for_checkin'
        can_checkin = bool(set(['Editor', 'Reviewer']).
                           intersection(set(local_roles)))

        return is_wc and is_ready and can_checkin

    def available(self):
        is_ok = self.context.aq_parent.getId() == 'checkout-folder'

        if is_ok:
            return

        return (
            (not is_anonymous()) and
            (self.can_checkout() or
             self.can_checkin() or
             (self.is_contributor() and self.can_cancel())
             )
        )


class CountryCheckoutViewlet(ViewletBase, CountryCheckoutView):

    @property
    def available(self):
        is_ok = self.context.aq_parent.getId() == 'checkout-folder'

        if not is_ok:
            return

        return (
            (not is_anonymous()) and
            (self.can_checkout() or
             self.can_checkin() or
             (self.is_contributor() and self.can_cancel())
             )
        )
