<p align="center">
  <img src="https://raw.githubusercontent.com/meilisearch/integration-guides/main/assets/logos/meilisearch_strapi.svg" alt="Meilisearch-Strapi" width="200" height="200" />
</p>

<h1 align="center">Meilisearch Strapi Plugin</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/meilisearch">Meilisearch</a> |
  <a href="https://docs.meilisearch.com">Documentation</a> |
  <a href="https://slack.meilisearch.com">Slack</a> |
  <a href="https://roadmap.meilisearch.com/tabs/1-under-consideration">Roadmap</a> |
  <a href="https://www.meilisearch.com">Website</a> |
  <a href="https://docs.meilisearch.com/faq">FAQ</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/strapi-plugin-meilisearch"><img src="https://img.shields.io/npm/v/strapi-plugin-meilisearch.svg" alt="npm version"></a>
  <a href="https://github.com/meilisearch/strapi-plugin-meilisearch/actions"><img src="https://github.com/meilisearch/strapi-plugin-meilisearch/workflows/Tests/badge.svg" alt="Tests"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/strapi-plugin-meilisearch/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://ms-bors.herokuapp.com/repositories/7"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

<p align="center">⚡ The Meilisearch plugin for Strapi</p>

Meilisearch is an open-source search engine. [Discover what Meilisearch is!](https://github.com/meilisearch/meilisearch)

Add your Strapi collections into a Meilisearch instance. The plugin listens to modifications made on your collections and updates Meilisearch accordingly.

## Table of Contents <!-- omit in toc -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🎬 Getting Started](#-getting-started)
- [💡 Run the Playground](#-run-the-playground)
- [🤖 Compatibility with Meilisearch and Strapi](#-compatibility-with-meilisearch-and-strapi)
- [⚙️ Development Workflow and Contributing](#️-development-workflow-and-contributing)
- [🌎 Community support](#-community-support)
- [🤩 Just for the pleasure of the eyes](#-just-for-the-pleasure-of-the-eyes)

## 📖 Documentation

To understand Meilisearch and how it works, see the [Meilisearch's documentation](https://docs.meilisearch.com/learn/what_is_meilisearch/).

To understand Strapi and how to create an app, see [Strapi's documentation](https://strapi.io/documentation/developer-docs/latest/getting-started/introduction.html).

## 🔧 Installation

Inside your Strapi app, add the package:

With `npm`:
```bash
npm install strapi-plugin-meilisearch
```

With `yarn`:
```bash
yarn add strapi-plugin-meilisearch
```

To apply the plugin to Strapi, a re-build is needed:
```bash
strapi build
```

You will need both a running Strapi app and a running Meilisearch instance. For [specific version compatibility see this section](#-compatibility-with-meilisearch).

### 🏃‍♀️ Run Meilisearch <!-- omit in toc -->

There are many easy ways to [download and run a Meilisearch instance](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

For example, if you use Docker:

```bash
docker pull getmeili/meilisearch:latest # Fetch the latest version of Meilisearch image from Docker Hub
docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest ./meilisearch --master-key=masterKey
```

### 🏃‍♂️ Run Strapi <!-- omit in toc -->

If you don't have a running Strapi project yet, you can either launch the [playground present in this project](#-run-the-playground) or [create a Strapi project](https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html).

We recommend adding your collections in development mode to allow the server reloads needed to apply a listener to the collections.

```bash
strapi develop
// or
yarn develop
```

### Run Both with Docker

To run Meilisearch and Strapi on the same server you can use Docker. A Docker configuration example can be found in the directory [`resources/docker`](resources/docker/) of this repository.

To run the Docker script add both files `Dockerfile` and `docker-compose.yaml` at the root of your Strapi project and run it with the following command: `docker-compose up`.

## 🎬 Getting Started

Now that you have installed the plugin, a running meiliSearch instance and, a running Strapi app, let's go to the plugin page on your admin dashboard.

On the left-navbar, `Meilisearch` appears under the `PLUGINS` category. If it does not, ensure that you have installed the plugin and re-build Strapi (see [installation](#-installation)).

### 🤫 Add Credentials <!-- omit in toc -->

First, you need to configure credentials via the strapi config, or on the plugin page.
The credentials are composed of:
- The `host`: The url to your running Meilisearch instance.
- The `api_key`: The `master` or `private` key as the plugin requires administration permission on Meilisearch.[More about permissions here](https://docs.meilisearch.com/reference/features/authentication.html).

⚠️ The `master` or `private` key should never be used to `search` on your front end. For searching, use the `public` key available on [the `key` route](https://docs.meilisearch.com/reference/api/keys.html#get-keys).


#### Using the plugin page

You can add you Meilisearch credentials in the upper box of the Meilisearch plugin page.

For example, using the credentials from the section above: [`Run Meilisearch`](#-run-meilisearch), the following screen shows where the information should be.

<p align="center">
<img src="./assets/credentials.png" alt="Add your credentials" width="600"/>
</p>

Once completed, click on the `add` button.

#### Using a config file

To use the strapi config add the following to `config/plugins.js` or `config/env/[NODE_ENV]/plugin.js`:

```js
module.exports = () => ({
  //...
  meilisearch: {
    // Your meili host
    host: "http://localhost:7700",
    // Your master key or private key
    apiKey: "masterKey",
  }
  //...
})
```

Using `config/env/[NODE_ENV]/plugin.js`, it is possible to have a config file for different environments.

Note that if you use both method, the config file overwrites the credentials added through the plugin page.


### 🚛 Add your collections to Meilisearch <!-- omit in toc -->

If you don't have any collection yet in your Strapi Plugin, please follow [Strapi quickstart](https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html).

We will use, as **example**, the collections provided by Strapi's quickstart.

On your plugin homepage, you should have two collections appearing: `restaurant` and `category`.

<p align="center">
<img src="./assets/restaurant_indexed.png" alt="Indexed collections need a reload" width="600"/>
</p>

By clicking on the left checkbox, the collection is automatically indexed in Meilisearch. For example, if you click on the `restaurant` checkbox, all your restaurants are now available in Meilisearch. We will see in [start searching](#-start-searching) how to try it out.

### 🪝 Apply Hooks <!-- omit in toc -->

Hooks are listeners that update Meilisearch each time you add/update/delete an entry in your collections.
To activate them, you will have to reload the server. If you are in develop mode, click on the red `Reload Server` button. If not, reload the server manually!

<p align="center">
<img src="./assets/restaurant_listener.png" alt="Collections listened" width="600"/>
</p>

### Customizing search indexing

#### Custom Index Name

By default, when indexing a collection in Meilisearch the index in Meilisearch has the same name as the collection. This behavior can be changed by setting the `indexName` property in the model file of the related collection.

**Example:**

In the following example, the model `restaurant` index in Meilisearch is called `my_restaurant` instead of the default `restaurant`.

```js
// api/restaurant/models/restaurant.js

module.exports = {
  meilisearch: {
    indexName: "my_restaurant"
  }
}
```

Examples can be found [this directory](./resources/custom-index-name).

### Composite Index

It is possible to bind multiple collections to the same index. They all have to share the same `indexName`.

For example if `shoes` and `shirts` should be bind to the same index, they should have the same `indexName` in their model setting:

```js
// api/shoes/models/shoes.js

module.exports = {
  meilisearch: {
    indexName: "product"
  }
}
```

```js
// api/shirts/models/shirts.js

module.exports = {
  meilisearch: {
    indexName: "product"
  }
}
```

Now, on each entry addition from both `shoes` and `shirts` the entry is added in the `product` index of Meilisearch.

Nonetheless, it is not possible to know how many entries from each collection is added to Meilisearch.

For example, given two collections:
- `Shoes`: with 300 entries and an `indexName` set to `product`
- `Shirts`: 200 entries and an `indexName` set to `product`

The index `product` has both the entries of shoes and shirts. If the index `product` has `350` documents in Meilisearch, it is not possible to know how many of them are from `shoes` or `shirts`.


#### Transform sent data

By default, the plugin sent the data the way it is stored in your Strapi collection. It is possible to remove or transform fields before sending your entries to Meilisearch.

Create the alteration function `transformEntry` in your Collection's model. Before sending the data to Meilisearch, every entry passes through this function where the alteration is applied.

You can find a lot of examples in [this directory](./resources/entries-transformers).

**Example**

To remove all private fields and relations from entries before indexing them into Meilisearch, use [`sanitizeEntity`](https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#controllers) in the `transFormEntry` function.

```js
// api/restaurant/models/restaurant.js
const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  meilisearch: {
    transformEntry({ entry, model }) {
      return sanitizeEntity(entry, { model })
    },
  },
}
```

Another example:<br>

The `restaurant` collection has a relation with the `category` collection. Inside a `restaurant` entry the `category` field contains an array of each category in an `object` format: `[{ name: "Brunch" ...}, { name: "Italian ... }]`.

To change that format to an array of category names, add a map function inside the `transformEntry` function.

```js
// api/restaurant/models/restaurant.js

module.exports = {
  meilisearch: {
    transformEntry(entry, model) {
      return  {
        ...entry,
        categories: entry.categories.map(cat => cat.name)
      };
    },
  }
}
```

Resulting in `categories` being transformed like this in a `restaurant` entry.
```json
  {
    "id": 2,
    "name": "Squared Pizza",
    "categories": [
      "Brunch",
      "Italian"
    ],
    // other fields
  }
```

By transforming the `categories` into an array of names, it is now compatible with the [`filtering` feature](https://docs.meilisearch.com/reference/features/filtering_and_faceted_search.html#configuring-filters) in Meilisearch.

#### 🏗 Add Meilisearch Settings

Each index in Meilisearch can be customized with specific settings. It is possible to add your [Meilisearch settings](https://docs.meilisearch.com/reference/features/settings.html#settings) configuration to the indexes you create using `settings` field in your model's config.

The settings are added when either: adding a collection to Meilisearch or when updating a collection in Meilisearch. The settings are not updated when documents are added through the [`listeners`](-apply-hooks).

**For example**
```js
module.exports = {
  meilisearch: {
    settings: {
      filterableAttributes: ['genres'],
      distinctAttribute: null,
      searchableAttributes: ['title', 'description', 'genres'],
      synonyms: {
        wolverine: ['xmen', 'logan'],
        logan: ['wolverine', 'xmen']
      }
    }
  },
}
```

[See resources](./resources/meilisearch-settings) for more settings examples.

### 🕵️‍♀️ Start Searching <!-- omit in toc -->

Once you have a collection containing documents indexed in Meilisearch, you can [start searching](https://docs.meilisearch.com/learn/getting_started/quick_start.html#search).

To search in Meilisearch, you can use the [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch) library that integrates a whole search interface, or our [meilisearch-js](https://github.com/meilisearch/meilisearch-js) SDK.

#### ⚡️ Using Instant meiliSearch <!-- omit in toc -->

You can have a front up and running in record time with [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch).

<p align="center">
<img src="./assets/obrigado.gif" alt="Restaurant demo" width="600"/>
</p>

In Instant Meilisearch, you only have to provide your credentials and index name (_uid_). `restaurant` is the index name in our example.

You can have a quick preview with the following code in an HTML file. Create an HTML file, copy-paste the code below and open the file in your browser (or find it in `/front_examples/restaurant.html`).

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@meilisearch/instant-meilisearch/templates/basic_search.css" />
  </head>
  <body>
    <div class="wrapper">
      <div id="searchbox" focus></div>
      <div id="hits"></div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@meilisearch/instant-meilisearch/dist/instant-meilisearch.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/instantsearch.js@4"></script>
    <script>
        const search = instantsearch({
            indexName: "restaurant",
            searchClient: instantMeiliSearch(
                "http://localhost:7700",
                'publicKey', // Use the public key not the private or master key to search.
            )
            });

            search.addWidgets([
              instantsearch.widgets.searchBox({
                  container: "#searchbox"
              }),
              instantsearch.widgets.configure({ hitsPerPage: 8 }),
              instantsearch.widgets.hits({
                  container: "#hits",
                  templates: {
                  item: `
                      <div>
                      <div class="hit-name">
                          {{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}
                      </div>
                      </div>
                  `
                  }
              })
            ]);
            search.start();
    </script>
  </body>
</html>
```

#### 💛 Using Meilisearch for JS <!-- omit in toc -->

You can also use [meilisearch-js](https://github.com/meilisearch/meilisearch-js) to communicate with Meilisearch.

The following code is a setup that will output a restaurant after a search.

```javascript
import { MeiliSearch } from 'meilisearch'

;(async () => {
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'publicKey', // Use the public key not the private or master key to search.
  })

  // An index is where the documents are stored.
  const response = client.index('movies').search('Biscoutte')
})()
```

**response content**:
```json
{
  "hits": [
    {
      "id": 3,
      "name": "Biscotte Restaurant",
      "description": "Welcome to Biscotte restaurant! Restaurant Biscotte offers a cuisine based on fresh, quality products, often local, organic when possible, and always produced by passionate producers.",
      "categories": []
    }
  ],
  "offset": 0,
  "limit": 20,
  "nbHits": 1,
  "exhaustiveNbHits": false,
  "processingTimeMs": 1,
  "query": "biscoutte"
}
```

## 💡 Run the Playground

Instead of adding the plugin to an existing project, you can try it out using the playground in this project.

```bash
# Root of repository
yarn playground:dev
```

This command will install the required dependencies and launch the app in development mode. You should be able to reach it on the [port 8000 of your localhost](http://localhost:8000/admin/).

## 🤖 Compatibility with Meilisearch and Strapi

**Supported Strapi versions**:

Complete installation requirements are the same as for Strapi itself and can be found in the documentation under [installation Requirements](https://strapi.io/documentation/v3.x/installation/cli.html#step-1-make-sure-requirements-are-met).

- Strapi v3.6.x

(This plugin may work with the older Strapi versions, but these are not tested nor officially supported at this time.)

**Supported Meilisearch versions**:

This package only guarantees the compatibility with the [version v0.26.0 of Meilisearch](https://github.com/meilisearch/meilisearch/releases/tag/v0.26.0).

**Node / NPM versions**:

- NodeJS >= 12.10 <= 14
- NPM >= 6.x

**We recommend always using the latest version of Strapi to start your new projects**.

## ⚙️ Development Workflow and Contributing

Any new contribution is more than welcome in this project!

If you want to know more about the development workflow or want to contribute, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions!

## 🌎 Community support

- For general help using **Meilisearch**, please refer to [the official Meilisearch documentation](https://docs.meilisearch.com).
- Contact the [Meilisearch support](https://docs.meilisearch.com/learn/what_is_meilisearch/contact.html)
- Strapi [community Slack](https://slack.strapi.io/)
- For general help using **Strapi**, please refer to [the official Strapi documentation](https://strapi.io/documentation/).

## 🤩 Just for the pleasure of the eyes

Using the [foodadvisor](https://github.com/strapi/foodadvisor) restaurant demo Strapi provided. We added a searchbar to it using [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch).

<p align="center">
<img src="./assets/restaurant.gif" alt="Fooradvisor demo" width="600"/>
</p>
