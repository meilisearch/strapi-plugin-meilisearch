# MeiliSearch in Strapi Plugin 🔎

Index your Strapi collections into a MeiliSearch instance. The plugin listens to modifications made on your collections and update MeiliSearch accordingly.

<p align="center">

  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://app.bors.tech/repositories/28762"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

MeiliSearch is an open-source search engine. [Discover what MeiliSearch  is!](https://github.com/meilisearch/meilisearch)

[Strapi](https://strapi.io/) is a backend CMS that makes creating and managing content easy.


## ⏳ Installation

To use this project you will need to clone it _(until this package is added to npm)_:

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

## Setup

To use MeiliSearch and Strapi there are two requirements:

### 🏃‍♀️ Run MeiliSearch

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

For example, if you use Docker:

```bash
docker pull getmeili/meilisearch:latest # Fetch the latest version of MeiliSearch image from Docker Hub
docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest ./meilisearch --master-key=masterKey
```


### 🏃‍♂️ Run Strapi

If you don't have a running Strapi project yet, you can either launch the [playground present in this project](#playground) or [create a Strapi Project](#create-strapi-project).

## Quick Start

Now that you have installed the plugin, a running meiliSearch instance and, a running Strapi app, lets go on your admin panel.

On the left-navbar MeiliSearch appears under the `PLUGINS` category.

![](/assets/left_navbar.png)

Clicking on the plugin will bring you to the MeiliSearch dashboard.

### Add Credentials

First, add your MeiliSearch credentials on the upper box of the MeiliSearch plugin page. For example, using the above credentials it looks like this:

![](/assets/credentials.png)

Once completed, click on the `add` button.


### Add your collections to MeiliSearch

If you don't have any collection yet in your Strapi Plugin, please follow [Strapi quickstart](https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html). If you used the playground, two collections are present `restaurant` and `category`.

![](/assets/collections.png)

By clicking on the left checkbox, the collection will automatically indexed in MeiliSearch. For example, if you click on the `restaurant` checkbox, all your restaurants are now available in MeiliSearch.

### Run Playground

Instead of adding the plugin to an existing project, you can try it out using the playground in this project.

```bash
# Root of repository
yarn playground:dev
```

This command will install required dependencies and launch the app in development mode. You should be able to reach it on the [port 8000 of your localhost](http://localhost:8000/admin/).


### Create Strapi project

Install Strapi with this **Quickstart** command to create a Strapi project instantly:

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
