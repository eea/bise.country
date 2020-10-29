from zope.component import adapts
from zope.interface import implementer

from bise.country.interfaces import ICountryPage
from eea.dexterity.rdfmarshaller.interfaces import ISurfResourceModifier


@implementer(ISurfResourceModifier)
class BiseCountryModifier(object):
    """Adds dcterms:references
    """

    adapts(ICountryPage)

    def __init__(self, context):
        self.context = context

    def run(self, resource, *args, **kwds):
        """Change the rdf resource
        """
        resource.dcterms_spatial = self.context.Title()
