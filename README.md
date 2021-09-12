<p align="center">
  <img src="https://raw.githubusercontent.com/meilisearch/integration-guides/main/assets/logos/meilisearch_strapi.svg" alt="MeiliSearch-Strapi" width="200" height="200" />
</p>

<h1 align="center">MeiliSearch Strapi Plugin</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/MeiliSearch">MeiliSearch</a> |
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
  <a href="https://app.bors.tech/repositories/32218"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

<p align="center">⚡ The MeiliSearch plugin for Strapi</p>

MeiliSearch is an open-source search engine. [Discover what MeiliSearch is!](https://github.com/meilisearch/meilisearch)

Add your Strapi collections into a MeiliSearch instance. The plugin listens to modifications made on your collections and updates MeiliSearch accordingly.

## Table of Contents <!-- omit in toc -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🎬 Getting Started](#-getting-started)
- [💡 Run the Playground](#-run-the-playground)
- [🤖 Compatibility with MeiliSearch and Strapi](#-compatibility-with-meilisearch-and-strapi)
- [⚙️ Development Workflow and Contributing](#️-development-workflow-and-contributing)
- [🌎 Community support](#-community-support)
- [🤩 Just for the pleasure of the eyes](#-just-for-the-pleasure-of-the-eyes)

## 📖 Documentation

To understand MeiliSearch and how it works, see the [MeiliSearch's documentation](https://docs.meilisearch.com/learn/what_is_meilisearch/).

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

You will need both a running Strapi app and a running MeiliSearch instance. For [specific version compatibility see this section](#-compatibility-with-meilisearch).

### 🏃‍♀️ Run MeiliSearch <!-- omit in toc -->

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

For example, if you use Docker:

```bash
docker pull getmeili/meilisearch:latest # Fetch the latest version of MeiliSearch image from Docker Hub
docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest ./meilisearch --master-key=masterKey
```

### 🏃‍♂️ Run Strapi <!-- omit in toc -->

If you don't have a running Strapi project yet, you can either launch the [playground present in this project](#-run-the-playground) or [create a Strapi project](https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html).

We recommend adding your collections in development mode to allow the server reloads needed to apply hooks.

```bash
strapi develop
// or
yarn develop
```

### Run Both with Docker

To run MeiliSearch and Strapi on the same server you can use Docker. A Docker configuration example can be found in the directory [`resources/docker`](resources/docker/) of this repository.

To run the Docker script add both files `Dockerfile` and `docker-compose.yaml` at the root of your Strapi project and run it with the following command: `docker-compose up`.

## 🎬 Getting Started

Now that you have installed the plugin, a running meiliSearch instance and, a running Strapi app, let's go to the plugin page on your admin dashboard.

On the left-navbar, `MeiliSearch` appears under the `PLUGINS` category. If it does not, ensure that you have installed the plugin and re-build Strapi (see [installation](#-installation)).

### 🤫 Add Credentials <!-- omit in toc -->

First, you need to configure credentials via the strapi config, or on the plugin page.

#### Using the plugin page

You can add you MeiliSearch credentials in the upper box of the MeiliSearch plugin page.

For example, using the credentials from the section above: [`Run MeiliSearch`](#-run-meilisearch), the following screen shows where the information should be.

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
    // Your master key
    api_key: "masterKey",
  }
  //...
})
```

Using `config/env/[NODE_ENV]/plugin.js`, it is possible to have a config file for different environments.

Note that if you use both method, the config file overwrites the credentials added through the plugin page.


### 🚛 Add your collections to MeiliSearch <!-- omit in toc -->

If you don't have any collection yet in your Strapi Plugin, please follow [Strapi quickstart](https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html).

We will use, as **example**, the collections provided by Strapi's quickstart.

On your plugin homepage, you should have two collections appearing: `restaurant` and `category`.

<p align="center">
<img src="./assets/collections_indexed.png" alt="Indexed collections need a reload" width="600"/>
</p>

By clicking on the left checkbox, the collection is automatically indexed in MeiliSearch. For example, if you click on the `restaurant` checkbox, all your restaurants are now available in MeiliSearch. We will see in [start searching](#-start-searching) how to try it out.

### 🪝 Apply Hooks <!-- omit in toc -->

Hooks are listeners that update MeiliSearch each time you add/update/delete an entry in your collections.
To activate them, you will have to reload the server. If you are in develop mode, click on the red `Reload Server` button. If not, reload the server manually!

<p align="center">
<img src="./assets/no_reload_needed.png" alt="Indexed collections are hooked" width="600"/>
</p>

### Customizing search indexing

#### Custom Index Name

By default, this plugin will create a search index with name same as that of model's name. This behavior can be changed by defining a property `searchIndexName` in your model.js file.

**Example:**

In the following example, the restaurants are not added to the default `restaurant` index but to a custom named `my_restaurant` index.
```js
// api/restaurant/models/restaurant.js

module.exports = {
  searchIndexName: "my_restaurant"
}
```

#### Transform sent data

By default, the plugin sent the data the way it is stored in your Strapi collection. It is possible to remove or transform fields before sending your entries to MeiliSearch.

Create the alteration function `toSearchIndex` in your Collection's model. Before sending the data to MeiliSearch, every entry passes through this function where the alteration is applied.

**Example**

Using the `restaurant` dataset provided in the `/playground`, we change the origin entry form in `toSearchIndex` the following way:
```js
  // api/restaurant/models/restaurant.js
module.exports = {
  toSearchIndex(entry) {
    const transformedEntry = {
      ...entry,
      id: entry.id,
      categories: entry.categories.map(cat => cat.name)
    };
    delete transformedEntry.created_by
    delete transformedEntry.updated_by
    return transformedEntry
  },
}
```

Resulting in entries being transformed before being sent to MeiliSearch. Output example of one entry:

```json
  {
    "categories": [
      "Brunch",
      "Italian"
    ],
    "description": "Not squared pizza's.",
    "id": 2,
    "name": "The round pizza"
  }
```

By transforming the `categories` into an array of names, it is now compatible with the [`filtering` feature](https://docs.meilisearch.com/reference/features/filtering_and_faceted_search.html#configuring-filters) in MeiliSearch.

### Composite Index

As per default, each collection is indexed in its own index. For example, the collection `restaurant` has its entries added in a index (default `restaurant`) and another collection `reviews` has its entried added in another index (default `review`).

In some circumstances, the entries of `restaurant` and `review` should go the same index.

While specifying a custom index name, if the index is shared more than one model, then this plugin need to handle statistics display, index deletion etc in a special way by considering that. so we need to specify that information by adding a optional field called `isUsingCompositeIndex` in model file


4. If multiple models are using same index, we can not get statistics of individual models. For that to work, we need to add an flag field while sending data for index. Name of that flag field should be specified in model definition as `searchIndexTypeId` This is applicable only if we are using a composite index.

For eg:
api/mymodelname/models/mymodelname.js
```javascript

'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  toSearchIndex(item) {
    return {
      id: 'mm'+item.id,  // simple id should not be added if the target search index is
                         // shared by more than one models.  Id number conflicts will
                         // cause unexpected behavior. Use a unique prefix in that case

      content: extractTextFromHtml(item.content), // Only index pure text
                                                  // content instead of indexing
                                                  // HTML content

      // I dont understand this fields naming neither the number
      $is_mymodelname: 1  // Consider that multiple entities are using same
                          // search index. So, Let's specify our model name here,
                          // so that we can identify it from the search result
    };
  },
  searchIndexName: 'searchindex',

  isUsingCompositeIndex: true, // the index 'searchindex' is shared with
                               // multiple models
  // why the $ ? Should it be crashing?
  searchIndexTypeId: '$is_mymodelname' // We count records in by counting this field
};


```

### 🕵️‍♀️ Start Searching <!-- omit in toc -->

Once you have a collection containing documents indexed in MeiliSearch, you can [start searching](https://docs.meilisearch.com/learn/getting_started/quick_start.html#search).

To search in MeiliSearch, you can use the [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch) library that integrates a whole search interface, or our [meilisearch-js](https://github.com/meilisearch/meilisearch-js) SDK.

#### ⚡️ Using Instant meiliSearch <!-- omit in toc -->

You can have a front up and running in record time with [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch).

<p align="center">
<img src="./assets/obrigado.gif" alt="Restaurant demo" width="600"/>
</p>

In Instant MeiliSearch, you only have to provide your credentials and index name (_uid_). `restaurant` is the index name in our example.

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
                "http://localhost:7700"
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

#### 💛 Using MeiliSearch for JS <!-- omit in toc -->

You can also use [meilisearch-js](https://github.com/meilisearch/meilisearch-js) to communicate with MeiliSearch.

The following code is a setup that will output a restaurant after a search.

```javascript
import { MeiliSearch } from 'meilisearch'

;(async () => {
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
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

## 🤖 Compatibility with MeiliSearch and Strapi

**Supported Strapi versions**:

Complete installation requirements are the same as for Strapi itself and can be found in the documentation under [installation Requirements](https://strapi.io/documentation/v3.x/installation/cli.html#step-1-make-sure-requirements-are-met).

- Strapi v3.6.x

(This plugin may work with the older Strapi versions, but these are not tested nor officially supported at this time.)

**Supported MeiliSearch versions**:

This package only guarantees the compatibility with the [version v0.23.0 of MeiliSearch](https://github.com/meilisearch/MeiliSearch/releases/tag/v0.23.0).

**Node / NPM versions**:

- NodeJS >= 12.10 <= 14
- NPM >= 6.x

**We recommend always using the latest version of Strapi to start your new projects**.

## ⚙️ Development Workflow and Contributing

Any new contribution is more than welcome in this project!

If you want to know more about the development workflow or want to contribute, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions!

## 🌎 Community support

- For general help using **MeiliSearch**, please refer to [the official MeiliSearch documentation](https://docs.meilisearch.com).
- Contact the [MeiliSearch support](https://docs.meilisearch.com/learn/what_is_meilisearch/contact.html)
- Strapi [community Slack](https://slack.strapi.io/)
- For general help using **Strapi**, please refer to [the official Strapi documentation](https://strapi.io/documentation/).

## 🤩 Just for the pleasure of the eyes

Using the [foodadvisor](https://github.com/strapi/foodadvisor) restaurant demo Strapi provided. We added a searchbar to it using [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch).

<p align="center">
<img src="./assets/restaurant.gif" alt="Fooradvisor demo" width="600"/>
</p>
