
# MeiliSearch in Strapi Plugin 🔎

Index your strapi Collections into a MeiliSearch instance. The plugin listens to modifications made on your collections and update MeiliSearch accordingly.

<p align="center">
  <!-- <a href="https://www.npmjs.com/package/meilisearch"><img src="https://img.shields.io/npm/v/meilisearch.svg" alt="npm version"></a> -->
  <!-- <a href="https://github.com/meilisearch/meilisearch-js/actions"><img src="https://github.com/meilisearch/meilisearch-js/workflows/Tests/badge.svg" alt="Tests"></a> -->
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://app.bors.tech/repositories/28762"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

[MeiliSearch](https://github.com/meilisearch/meilisearch) is a open-source and easy to use search engine.
[Strapi](https://strapi.io/) is a backend CMS that makes creating and managing content easy.

## Usage during development

Until this package is released on `NPM`, you can use it the following way"

### ⏳ Installation

To use this project you will need to clone it:

```
$ git clone git@github.com:meilisearch/strapi-plugin-meilisearch.git
$ cd strapi-plugin-meilisearch
```

Install all required dependencies: 
```
# with yarn
yarn install

# with yarn
npm install
```

### Using playground

Instead of adding the plugin to an existing project, you can try it out using the playground. 

```
# with yarn
yarn develop
```




Install Strapi with this **Quickstart** command to create a Strapi project instantly:


#### Create strapi project

- (Use **yarn** to install the Strapi project (recommended). [Install yarn with these docs](https://yarnpkg.com/lang/en/docs/install/).)

```bash
# with yarn
yarn create strapi-app my-project --quickstart

# with npm/npx
npx create-strapi-app my-project --quickstart
```

_This command generates a brand new project with the default features (authentication, permissions, content management, content type builder & file upload). The **Quickstart** command installs Strapi using a **SQLite** database which is used for prototyping in development._


#### Clone and add plugin

Clone this project






## What is Strapi ?

Strapi is a backend CMS. Meaning it does not provide any front-end implementations.

It provides an API end point the same way meilisearch does. To generate the API endpoints strapi needs you to configure your needs in their dashboard.

## API

The API is created based on the `collections` you created in your strapi Dashboard. 
A collection is like a table in SQL, it also requires you to describe each field ( `name: string, required, etc..`).


## Dashboard

The collections are created using the dashboard of stripe.
Collections customisations looks a lot like the ones in SQL. You can create relations between collections but in a way more intuitive way. 


## Plugins

Strapi provides two sort of plugins.

- [Plugins](https://strapi.io/documentation/developer-docs/latest/plugin-development/quick-start.html#development-environment-setup). Lets call them `official plugins`.
   They are provided by Strapi and only 8 exists.
- [Local plugins](https://strapi.io/documentation/developer-docs/latest/plugin-development/quick-start.html#development-environment-setup)
    Local plugins lets you create your own plugins to create business logic for you API (i.e create additional routes or modify information before it is returned)
    

Local plugins and official plugins seems to work exactly the same way with the exception that one is downloadable in the marketplace (the official ones).


## Our goal

We want to create a Plugin that provides automatic actions and interface on the strapi dashboard that lets the user create its need. The User should be able to create or remove new collections from MeiliSearch and to add settings to the indexes.

In the background, the plugin should re-index the documents that have been changed in the collections. 
For exemple, If I change the name of the restaurant Tonio with Tony in my strapi interface, an update should automaticly done to update it aswell on MeiliSearch.

No additional routes should be created on strapi for the front end users as they will be using the MeiliSearch API to search and not Strapi (unless we want to make this possible?).

## MVP

- Downloadable plugin
- Communication with a running MeiliSearch
- Interface with the following: 
    - Add host and keys
    - Ability to chose which collections should be indexed in MeiliSearch
    - Every time a collection is updated, the updated element should be updated in MeiliSearch as well (listener to add, edit and delete)
    - Possibility to remove a collection from MeiliSearch

### Bonus 

- Possibility for the user to click `add to meilisearch` on Collection creation
