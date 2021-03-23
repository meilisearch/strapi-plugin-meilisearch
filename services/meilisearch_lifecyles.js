'use strict'
const fs = require('fs')
const path = require('path')

const NO_LIFECYCLE_TEMPLATE_PATH = 'empty_lifecycle_template.js'
const LIFECYCLE_TEMPLATE_PATH = 'lifecycle_template.js'
const getModelPath = (collection) => path.resolve(process.cwd(), `./api/${collection}/models/${collection}.js`)
const getAssetPath = (asset) => path.resolve(process.cwd(), `./plugins/meilisearch/assets/${asset}`)
const getFileContent = (filePath) => fs.readFileSync(filePath, { encoding: 'utf-8' })
const getAssetContent = (asset) => getFileContent(getAssetPath(asset))
const fileExist = (filePath) => fs.existsSync(filePath)

function copyTemplate (modelPath, asset) {
  const lifecycleTemplatePath = getAssetPath(asset)
  console.log(lifecycleTemplatePath)
  fs.copyFileSync(lifecycleTemplatePath, modelPath)
  return true
}

function defaultModel (modelPath, asset) {
  const modelLifeCycle = getFileContent(modelPath)
  const emptyLifecycle = getAssetContent(asset)

  // Only add template if model file is default one
  return modelLifeCycle === emptyLifecycle
}

function defaultEmptyTemplate (modelPath) {
  return defaultModel(modelPath, NO_LIFECYCLE_TEMPLATE_PATH)
}

function defaultLifecycleTemplate (modelPath) {
  console.log({ modelPath })
  return defaultModel(modelPath, LIFECYCLE_TEMPLATE_PATH)
}

function add (collection) {
  const modelPath = getModelPath(collection)
  console.log('ADD LIFECYLE')
  // If the lifecyle file exist
  if (fileExist(modelPath) || defaultEmptyTemplate(modelPath)) {
    return copyTemplate(modelPath, LIFECYCLE_TEMPLATE_PATH)
  }
  return false
}

function remove (collection) {
  const modelPath = getModelPath(collection)
  if (defaultLifecycleTemplate(modelPath)) {
    return copyTemplate(modelPath, NO_LIFECYCLE_TEMPLATE_PATH)
  }
  return false
}

module.exports = {
  add,
  remove,
  defaultEmptyTemplate,
  defaultLifecycleTemplate
}
