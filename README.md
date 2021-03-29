<h1 align="center">MeiliSearch Strapi Plugin</h1>

<p align="center">
  <img src="https://res.cloudinary.com/meilisearch/image/upload/v1587402338/SDKs/meilisearch_js.svg" alt="MeiliSearch-JavaScript" width="200" height="200" />
</p>

<h4 align="center">
  <a href="https://github.com/meilisearch/MeiliSearch">MeiliSearch</a> |
  <a href="https://docs.meilisearch.com">Documentation</a> |
  <a href="https://slack.meilisearch.com">Slack</a> |
  <a href="https://roadmap.meilisearch.com/tabs/1-under-consideration">Roadmap</a> |
  <a href="https://www.meilisearch.com">Website</a> |
  <a href="https://docs.meilisearch.com/faq">FAQ</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/meilisearch"><img src="https://img.shields.io/npm/v/meilisearch.svg" alt="npm version"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/actions"><img src="https://github.com/meilisearch/meilisearch-js/workflows/Tests/badge.svg" alt="Tests"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://app.bors.tech/repositories/28762"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

<p align="center">⚡ The MeiliSearch plugin for Strapi</p>

MeiliSearch is an open-source search engine. [Discover what MeiliSearch is!](https://github.com/meilisearch/meilisearch)

Add your Strapi collections into a MeiliSearch instance. The plugin listens to modifications made on your collections and update MeiliSearch accordingly.

## Table of Contents <!-- omit in toc -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🎬 Getting Started](#-getting-started)
- [🤖 Compatibility with MeiliSearch](#-compatibility-with-meilisearch)
- [💡 Learn More](#-learn-more)
- [⚙️ Development Workflow and Contributing](#️-development-workflow-and-contributing)
- [✋ Requirements](#-requirements)

## 📖 Documentation

To understand MeiliSearch and how it works, see the [Documentation](https://docs.meilisearch.com/learn/what_is_meilisearch/).
To understand Strapi and how to create an app, see the [Documentation](https://strapi.io/documentation/developer-docs/latest/getting-started/introduction.html).

## 🔧 Installation

Inside your Strapi app, add the package:

With `npm`:
```bash
npm install strapi-plugin-meilisearch
```

With `yarn`:
```bash
npm install strapi-plugin-meilisearch
```

To apply the plugin to Strapi, a re-build is needed:
```bash
strapi build
```

You will need both a running Strapi app and a running MeiliSearch instance. For [specific version requirements see this section](#-requirements).

### 🏃‍♀️ Run MeiliSearch

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

Instead of adding the plugin to an existing project, you can try it out using the playground.

```bash
# with yarn
yarn develop
```

### 🏃‍♂️ Run Strapi

If you don't have a running Strapi project yet, you can either launch the [playground present in this project](#playground) or [create a Strapi Project](#create-strapi-project).


It is recommended to add your collections in developement mode as it allows the server reloads, needed to apply hooks.

```bash
strapi develop
```

## 🎬 Getting Started

Now that you have installed the plugin, a running meiliSearch instance and, a running Strapi app, lets go the plugin page on your admin dashboard.

On the left-navbar `MeiliSearch` appears under the `PLUGINS` category. If it does not, ensure that you have installed the plugin and re-build Strapi (see [installation](#-installation)).

### 🤫 Add Credentials

First, add your MeiliSearch credentials in the upper box of the MeiliSearch plugin page.

For example, using the credentials used in the [above section](#-run-meilisearch) it looks like this:

![](/assets/credentials.png)

Once completed, click on the `add` button.


### 🚛 Add your collections to MeiliSearch

If you don't have any collection yet in your Strapi Plugin, please follow [Strapi quickstart](https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html).

We will use, as **example**, the collections provided by Strapi's quickstart.

On your plugin homepage you should have two collections appearing: `restaurant` and `category`.

![](/assets/collections.png)

By clicking on the left checkbox, the collection will be automatically indexed in MeiliSearch. For example, if you click on the `restaurant` checkbox, all your restaurants are now available in MeiliSearch.

You can check it using

### Run Playground

Instead of adding the plugin to an existing project, you can try it out using the playground in this project.

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
3. Build
```bash
yarn build
```
4. Develop

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
