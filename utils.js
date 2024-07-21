function escapeMarkdown(text) {
  return text.replace(/([\\_*|`~])/g, '\\$1');
}

export { escapeMarkdown };
