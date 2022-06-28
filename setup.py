""" Setup bise.country
"""

import os
from setuptools import setup, find_packages

NAME = "bise.country"
PATH = NAME.split('.') + ['version.txt']
VERSION = open(os.path.join(*PATH)).read().strip()

setup(name=NAME,
      version=VERSION,
      description="Country profiles extension for Bise",
      long_description=open("README.md").read() + "\n" +
      open(os.path.join("docs", "HISTORY.txt")).read(),
      # Get more strings from
      # http://pypi.python.org/pypi?:action=list_classifiers
      classifiers=[
          "Framework :: Plone",
          "Programming Language :: Python",
      ],
      keywords='',
      author='Tiberiu Ichim',
      author_email='tiberiu.ichim@eaudeweb.ro',
      maintainer='Tiberiu Ichim',
      maintainer_email='tiberiu.ichim@eaudeweb.ro',
      url='https://github.com/eea/bise.country',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['bise'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          # -*- Extra requirements: -*-
      ],
      entry_points="""
      # -*- Entry points: -*-

      [z3c.autoinclude.plugin]
      target = plone
      """,
      setup_requires=["PasteScript"],
      paster_plugins=["ZopeSkel"],
      )
