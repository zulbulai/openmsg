/**
 * Spintax (Spin Syntax) Parser for WhatsApp Campaigns
 * Supports nested spintax: {Hello|Hi|{Hey|Greetings}} {{Name}}, {how are you|hope you are doing well}!
 */

function parseSpintax(text) {
  if (!text || typeof text !== 'string') return '';

  const regex = /\{([^{}]+)\}/;
  let matches;

  // Loop until all innermost curly brackets are resolved
  while ((matches = regex.exec(text)) !== null) {
    const choices = matches[1].split('|');
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    text = text.replace(matches[0], randomChoice);
  }

  return text;
}

/**
 * Replace dynamic contact variables like {{Name}}, {{Phone}}, {{Company}}, etc.
 */
function replaceVariables(template, contactData = {}) {
  if (!template) return '';
  let result = template;

  for (const [key, val] of Object.entries(contactData)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, val != null ? String(val) : '');
  }

  return result;
}

/**
 * Prepare a personalized message by first replacing variables and then resolving Spintax
 */
function preparePersonalizedMessage(template, contactData = {}) {
  const withVars = replaceVariables(template, contactData);
  return parseSpintax(withVars);
}

module.exports = {
  parseSpintax,
  replaceVariables,
  preparePersonalizedMessage
};
