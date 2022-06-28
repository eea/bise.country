"""Interfaces"""
from zope.interface import Interface


class ICountryFolder(Interface):
    """ Marker interface for a country folder
    """


class ICountryPage(Interface):
    """ Marker interface for a country page.

    Country page can be plain documents in /countries
    and also in another pages (ex. GI, Biodiversity Factsheets,
    FolderishPage)
    """
