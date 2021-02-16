# Strapi intégration

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

### MVP of MVP
- Downloadable plugin
- Communication with a running MeiliSearch
- Interface with the following: 
    - Add host and keys
    - Ability to chose which collections should be indexed in MeiliSearch
    - Every time a collection is updated, the updated element should be updated in MeiliSearch as well (listener to add, edit and delete)
    - Possibility to remove a collection from MeiliSearch

### MVP ++ 

Same as Above with two small differences: 
- Add settings (json file) 
- Settings are added through a nicer interface
- Possibility to add relations between Collections. Exemple: Given 2 collections, `restaurants` and `users`, facet

### Bonus 

- Possibility for the user to click `add to meilisearch` on Collection creation

## STEPS PAR PHASE

### Architecture 
- Playground -> app strapi
- src -> contain plugin
- tests

### PRE A
- [ ] Petit README 
- [ ] Linter
- [ ] Contributing
- [ ] How do you add plugin to Strapi

### A

- [ ] Create local plugin
- [ ] Create back-end communication with MeiliSearch (Connection, index creation, doc addition)
- [ ] Create UI for HOST and KEY on dashboard
- [ ] Create UI for index name on dashboard
- [ ] Create UI for document addition (in STEP A you have to provide a json string)

-> This Creates a working version of MeiliSearch on Strapi but does not communicate with strapi yet


### B

- [ ] Determine HOW to tests: e2e, integration
    - [ ] framework the test 
- [ ] CI 
- [ ] Documents comes from chosen collection and not JSON string
    - [ ] User choses a collection amongst all its displayed collections
        - [ ] Communication between MeiliSearch and Strapi to fetch collection names + collection items
        - [ ] Create UI where all collections are shown
    - [ ] Plugin creates an index with this name
    - [ ] Plugin adds all items from the collection to the index

-> This create the interraction between strapi and MeiliSearch

### C

- [ ] Possibility to add more than one collection (hear multiple indexes)
- [ ] Add a listener on changes on all collections (ex if a restaurant is deleted it should be deleted from meilisearch as well)

-> This create all basic needs of a user with MeiliSearch

### E (BONUS or open for debate)

- [ ] Add customizable collections Relations.
    Exemple: Two collections: Restaurants and Category. Category has a many to many relation with Restaurant. Automatic array creation should be created when indexing both. Example a Restaurant with its relation to Category
```js
{
    id: '1'
    name: 'La belle frite',
    Category: ['Gras', 'Belge', 'Gastronomique']
}

```
And without
```js
{
    id: '1'
    name: 'La belle frite'
}

```
## Consideration

- [ ] adding a preview searchbar in the plugin page

## TODO
- [ ] Steps on issues and notions
- [ ] How do they handle testing ? 


### Not in MVP

- [ ] Settings on each index in a JSON string
- [ ] Warning on re-indexation when changing Settings ? (find a way)
- [ ] more friendly settings UI (still ugly but not a json string) attached to each index. 
