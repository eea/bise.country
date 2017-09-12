from plone.dexterity.content import Container
from zope.interface import Interface, implements
from zope.schema import List, TextLine


class ICountryFactsheet(Interface):
    """ A country factsheet
    """

    tab_titles = List(
        title=u"Tab titles",
        unique=True,
        default=[u'Factsheet', u'Contributions', u'MAES'],
        value_type=TextLine(title=u"Tab")
    )


class CountryFactsheet(Container):
    """ A country factsheet
    """

    implements(ICountryFactsheet)
