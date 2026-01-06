# Contributing <!-- omit in toc -->

First of all, thank you for contributing to Meilisearch! The goal of this document is to provide everything you need to know in order to contribute to Meilisearch and its different integrations.

- [Assumptions](#assumptions)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Git Guidelines](#git-guidelines)
- [Release Process (for internal team only)](#release-process-for-internal-team-only)

## Assumptions

1. **You're familiar with [GitHub](https://github.com) and the [Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)(PR) workflow.**
2. **You've read the Meilisearch [documentation](https://www.meilisearch.com/docs) and the [README](/README.md).**
3. **You know about the [Meilisearch community](https://discord.com/invite/meilisearch). Please use this for help.**

## How to Contribute

1. Make sure that the contribution you want to make is explained or detailed in a GitHub issue! Find an [existing issue](https://github.com/meilisearch/strapi-plugin-meilisearch/issues/) or [open a new one](https://github.com/meilisearch/strapi-plugin-meilisearch/issues/new).
2. Once done, [fork the strapi-plugin-meilisearch repository](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) in your own GitHub account. Ask a maintainer if you want your issue to be checked before making a PR.
3. [Create a new Git branch](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository).
4. Review the [Development Workflow](#development-workflow) section that describes the steps to maintain the repository.
5. Make the changes on your branch.
6. [Submit the branch as a PR](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) pointing to the `main` branch of the main strapi-plugin-meilisearch repository. A maintainer should comment and/or review your Pull Request within a few days. Although depending on the circumstances, it may take longer.<br>
   We do not enforce a naming convention for the PRs, but **please use something descriptive of your changes**, having in mind that the title of your PR will be automatically added to the next [release changelog](https://github.com/meilisearch/strapi-plugin-meilisearch/releases/).

## Getting Started

This repository contains two packages:
- the **Plugin**: the Meilisearch Strapi plugin, located at the root of the repository
- the **Playground**: an example Strapi app that uses the plugin for testing purposes, located in the `playground` directory

### Setup <!-- omit in toc -->

You can set up your local environment natively or using `docker` (see [`docker-compose.yml`](./docker-compose.yml)).

Install dependencies of the Strapi plugin:

```bash
# in the root folder
yarn
```

Install dependencies of the playground:

```bash
# from the root folder
cd playground
# now, in the playground folder
yarn
```

### Playground Setup

To test your changes, you can use the playground.

Install playground dependencies:

```bash
# Root of repository
yarn watch:link          # Build the plugin and release it with yalc
yarn playground:setup    # Seed the playground DB into playground/.tmp/data.db

# Playground dir
cd playground
yarn dlx yalc add --link strapi-plugin-meilisearch
yarn install
```

For practicity, you can run these commands from the root directory:

```bash
yarn playground:build    # Build the playground
yarn playground:dev      # Start the development server
```

You can log in on the admin panel with these credentials:
- email: `superadmin@meilisearch.com`
- password: `password`

## Testing

Running the tests require to have a Meilisearch instance running. We recommend running it with Docker:

```bash
# Run a Meilisearch instance
docker pull getmeili/meilisearch-enterprise:latest
docker run -p 7700:7700 getmeili/meilisearch-enterprise:latest meilisearch --master-key=masterKey --no-analytics
```

### Integration Tests <!-- omit in toc -->

Then:

```bash
# Integration tests
yarn test
```

### Cypress E2E Tests <!-- omit in toc -->

> [!info]
> You should run `yarn playground:setup` any time you need to reset the playground database to its default state for end-to-end tests.

**With the Cypress app**

```bash
# Starts playground + opens Cypress UI
yarn test:e2e:watch
```

This command starts the Strapi playground via `yarn playground:dev` and opens Cypress in interactive mode using the default `develop` environment configuration.

**In the Terminal**

If you already have the playground running (e.g. via `yarn playground:dev`), you can run Cypress directly:

```bash
# Open Cypress UI
yarn cypress open

# Run tests in terminal
yarn cypress run
```

### Linter and Formatter <!-- omit in toc -->

You can run lint and fix the formatting errors with:

```bash
# Linter
yarn style

# Linter with fixing
yarn style:fix
```


## Git Guidelines

### Git Branches <!-- omit in toc -->

All changes must be made in a branch and submitted as PR.
We do not enforce any branch naming style, but please use something descriptive of your changes.

### Git Commits <!-- omit in toc -->

As minimal requirements, your commit message should:

- be capitalized
- not finish by a dot or any other punctuation character (!,?)
- start with a verb so that we can read your commit message this way: "This commit will ...", where "..." is the commit message.
  e.g.: "Fix the home page button" or "Add more tests for create_index method"

We don't follow any other convention, but if you want to use one, we recommend [this one](https://chris.beams.io/posts/git-commit/).

### GitHub Pull Requests <!-- omit in toc -->

Some notes on GitHub PRs:

- [Convert your PR as a draft](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/changing-the-stage-of-a-pull-request) if your changes are a work in progress: no one will review it until you pass your PR as ready for review.<br>
  The draft PR can be very useful if you want to show that you are working on something and make your work visible.
- All PRs must be reviewed and approved by at least one maintainer.
- The PR title should be accurate and descriptive of the changes. The title of the PR will be indeed automatically added to the next [release changelogs](https://github.com/meilisearch/strapi-plugin-meilisearch/releases/).

## Release Process (for the internal team only)

Meilisearch tools follow the [Semantic Versioning Convention](https://semver.org/).

### Automated Changelogs

This project integrates a tool to create automated changelogs.<br>
_[Read more about this](https://github.com/meilisearch/integration-guides/blob/main/resources/release-drafter.md)._

### How to Publish the Release

⚠️ Before doing anything, make sure you got through the guide about [Releasing an Integration](https://github.com/meilisearch/integration-guides/blob/main/resources/integration-release.md).

Make a PR modifying the file [`package.json`](/package.json) with the right version.

```javascript
"version": "X.X.X",
```

Once the changes are merged on `main`, you can publish the current draft release via the [GitHub interface](https://github.com/meilisearch/strapi-plugin-meilisearch/releases): on this page, click on `Edit` (related to the draft release) > update the description (be sure you apply [these recommendations](https://github.com/meilisearch/integration-guides/blob/main/resources/integration-release.md#writting-the-release-description)) > when you are ready, click on `Publish release`.

GitHub Actions will be triggered and push the package to [npm](https://www.npmjs.com/package/strapi-plugin-meilisearch).

#### Release a `beta` Version

Here are the steps to release a beta version of this package:

- Create a new branch originating the branch containing the "beta" changes. For example, if during the Meilisearch pre-release, create a branch originating `bump-meilisearch-v*.*.*`.<br>
  `vX.X.X` is the next version of the package, NOT the version of Meilisearch!

```bash
git checkout bump-meilisearch-v*.*.*
git pull origin bump-meilisearch-v*.*.*
git checkout -b vX.X.X-beta.0
```

- Change the version in [`package.json`](/package.json) and commit it to the `beta` branch.

- Go to the [GitHub interface for releasing](https://github.com/meilisearch/strapi-plugin-meilisearch/releases): on this page, click on `Draft a new release`.

- Create a GitHub pre-release:
  - Fill the description with the detailed changelogs
  - Fill the title with `vX.X.X-beta.0`
  - Fill the tag with `vX.X.X-beta.0`
  - ⚠️ Select the `vX.X.X-beta.0` branch and NOT `main`
  - ⚠️ Click on the "This is a pre-release" checkbox
  - Click on "Publish release"

GitHub Actions will be triggered and push the beta version to [npm](https://www.npmjs.com/package/meilisearch).

💡 If you need to release a new beta for the same version (i.e. `vX.X.X-beta.1`):

- merge the change into `bump-meilisearch-v*.*.*`
- rebase the `vX.X.X-beta.0` branch
- change the version name in `package.json`
- create a pre-release via the GitHub interface

<hr>

Thank you again for reading this through. We can not wait to begin to work with you if you make your way through this contributing guide ❤️
