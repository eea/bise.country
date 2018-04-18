from plone.app.textfield import RichText
from plone.dexterity.content import Container
from zope.interface import Interface, implements
from zope.schema import List, Text, TextLine


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

    fact_countryName = TextLine(
        title=(u'Country name'),
        description=(u'Name of the country to use in the maps '),
        required=True,
        )
    fact_countryCode = TextLine(
        title=(u'Country code'),
        description=(u'Two letter country code to use in the maps '),
        required=True,
        )
    fact_countryISOCode = TextLine(
        title=(u'Country ISO code'),
        description=(u'Three letter country ISO code to use in the maps'),
        required=True,
        )


class CountryFactsheet(Container):
    """ A country factsheet
    """

    implements(ICountryFactsheet)
