from plone.app.textfield import RichText
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

    text = RichText(title=(u"Description"),
                    description=u"Provide a description of the country.",
                    required=True)


class CountryFactsheet(Container):
    """ A country factsheet
    """

    implements(ICountryFactsheet)
