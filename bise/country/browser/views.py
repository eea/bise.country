from lxml.builder import E
from lxml.html import fromstring, tostring
from plone.subrequest import subrequest


class CountryFactsheetView(object):
    """
    """

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
