# MeiliSearch in Strapi Plugin 🔎

Index your Strapi collections into a MeiliSearch instance. The plugin listens to modifications made on your collections and update MeiliSearch accordingly.

<p align="center">

  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://app.bors.tech/repositories/28762"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

MeiliSearch is an open-source search engine. [Discover what MeiliSearch  is!](https://github.com/meilisearch/meilisearch)

[Strapi](https://strapi.io/) is a backend CMS that makes creating and managing content easy.

## Usage during WIP

Until this package is released on `npm`, you can use it the following way:

### ⏳ Installation

To use this project you will need to clone it:

```
git clone git@github.com:meilisearch/strapi-plugin-meilisearch.git
cd strapi-plugin-meilisearch
```

Install all required dependencies:
```bash
# with yarn
yarn install

# with yarn
npm install
```

### Using playground

Instead of adding the plugin to an existing project, you can try it out using the playground.

```bash
# with yarn
yarn develop
```

Or if you want to use `npm`, by going inside the directory:
```bash
# with npm
cd playground
npm install
npm run develop
```

Install Strapi with this **Quickstart** command to create a Strapi project instantly:


#### Create strapi project

- Use **yarn** to install the Strapi project (recommended). [Install yarn with these docs](https://yarnpkg.com/lang/en/docs/install/).)

```bash
# with yarn
yarn create strapi-app my-project --quickstart

# with npm/npx
npx create-strapi-app my-project --quickstart
```

_This command generates a brand new project with the default features (authentication, permissions, content management, content type builder & file upload). The **Quickstart** command installs Strapi using a **SQLite** database which is used for prototyping in development._


Once your Strapi project has been created, to link the plugin to this project you have to create a symbolic link inside a plugin folder at the root of the Strapi project.

1. Create plugin folder

```bash
mkdir plugins
```
2. Create symbolic link

```bash
cd plugins
ln -s [PATH_TO_PLUGIN] meilisearch
```
3. Develop

```bash
yarn develop
```

You can now use the plugin on your Strapi project.

## 🖐 Requirements

Complete installation requirements are exact same as for Strapi itself and can be found in the documentation under [Installation Requirements](https://strapi.io/documentation/v3.x/installation/cli.html#step-1-make-sure-requirements-are-met).

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

We want to create a plugin that provides automatic actions and an interface on the Strapi dashboard that helps the user start with MeiliSearch. The User should be able to create or remove new collections from MeiliSearch.

In the background, the plugin should re-index the documents that have been changed in the collections.<br>
For example, If I change the name of the restaurant `Tonio` with `Tony` in a Strapi collection, an update should automatically be done to update it as well on MeiliSearch.

No additional routes should be created on strapi for the front end users as they will be using the MeiliSearch API to search and not Strapi (unless we want to make this possible?).

## MVP

[You can follow allong the progression of this project here](https://github.com/meilisearch/strapi-plugin-meilisearch/issues).
