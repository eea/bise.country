from plone.dexterity.content import Container
from zope.interface import Interface, implements


class ICountryFactsheet(Interface):
    """ A country factsheet
    """


class CountryFactsheet(Container):
    """ A country factsheet
    """

    implements(ICountryFactsheet)
