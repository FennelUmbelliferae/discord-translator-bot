import { readFileSync, writeFileSync } from 'fs';

const CONFIG_FILE_PATH = './config/config.json';

function escapeMarkdown(text) {
  return text.replace(/([\\_*|`~])/g, '\\$1');
}

// Config management functions
function getConfig() {
  return JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf8'));
}

function setConfig(config) {
  writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
}

// Get current config values
let config = getConfig();
let selectedLanguages = config.selectedLanguages || ['JA', 'KO'];
let skipTranslationPrefix = config.skipTranslationPrefix || ';';

// Skip prefix management
function getSkipTranslationPrefix() {
  return skipTranslationPrefix;
}

function setSkipTranslationPrefix(newPrefix) {
  skipTranslationPrefix = newPrefix;
  config.skipTranslationPrefix = newPrefix;
  setConfig(config);
  return skipTranslationPrefix;
}

// Selected languages management
function getSelectedLanguages() {
  return selectedLanguages;
}

function setSelectedLanguages(newLanguages) {
  selectedLanguages = newLanguages;
  config.selectedLanguages = newLanguages;
  setConfig(config);
  return selectedLanguages;
}

export { 
  escapeMarkdown,
  getConfig,
  setConfig,
  getSkipTranslationPrefix,
  setSkipTranslationPrefix,
  getSelectedLanguages,
  setSelectedLanguages
};
