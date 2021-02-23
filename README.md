# MeiliSearch in Strapi Plugin 🔎

Index your Strapi collections into a MeiliSearch instance. The plugin listens to modifications made on your collections and update MeiliSearch accordingly.

<p align="center">

  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://app.bors.tech/repositories/28762"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

[MeiliSearch](https://github.com/meilisearch/meilisearch) is a open-source and easy to use search engine.
[Strapi](https://strapi.io/) is a backend CMS that makes creating and managing content easy.

## Usage during WIP

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

Or if you want to use `npm`, by going inside the directory:
```
# with npm
cd playground
npm install
npm run develop
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


Once your strapi project has been created, to link the plugin to this project you have to create a symbolic link inside a plugin folder at the root of the strapi project.

1. Create plugin folder
```
mkdir plugins
```
2. Create symbolic link
```
cd plugins
ln -s [PATH_TO_PLUGIN] meilisearch
```
3. Develop
```
yarn develop
```

You can now use the plugin on your strapi project.

## 🖐 Requirements

Complete installation requirements are exact same as for Strapi itself and can be found in the documentation under <a href="https://strapi.io/documentation/v3.x/installation/cli.html#step-1-make-sure-requirements-are-met">Installation Requirements</a>.

**Supported Strapi versions**:

- Strapi v3.4.x

(This plugin may work with the older Strapi versions, but these are not tested nor officially supported at this time.)

**Node / NPM versions**:

- NodeJS >= 12.10 <= 14
- NPM >= 6.x

**We recommend always using the latest version of Strapi to start your new projects**.

## 🌎 Community support

- For general help using Strapi, please refer to [the official Strapi documentation](https://strapi.io/documentation/).
- Strapi Slack [channel](https://slack.strapi.io/)

## Plugin's goal

We want to create a Plugin that provides automatic actions and an interface on the strapi dashboard that helps the user start with MeiliSearch. The User should be able to create or remove new collections from MeiliSearch.

In the background, the plugin should re-index the documents that have been changed in the collections.
For exemple, If I change the name of the restaurant `Tonio` with `Tony` in a strapi collection, an update should automaticly be done to update it aswell on MeiliSearch.

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
