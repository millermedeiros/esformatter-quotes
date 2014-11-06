//jshint node:true, eqnull:true
'use strict';

var DOUBLE_QUOTE = '"';
var SINGLE_QUOTE = '\'';

var avoidEscape;
var disabled;
var quoteValue;
var alternateQuote;
var normalizeObjectKeys;


exports.setOptions = function(opts) {
  opts = opts && opts.quotes;
  if (!opts || (opts.type == null && opts.avoidEscape == null)) {
    disabled = true;
    return;
  }
  if (opts.type != null) {
    quoteValue = opts.type === 'single' ? SINGLE_QUOTE : DOUBLE_QUOTE;
    alternateQuote = opts.type !== 'single' ? SINGLE_QUOTE : DOUBLE_QUOTE;
  }
  avoidEscape = opts.avoidEscape;
  normalizeObjectKeys = opts.normalizeObjectKeys;
};


exports.tokenBefore = function(token) {
  if (disabled) return;

  if (token.type === 'String') {
    var newTokenValue = getNormalizedStringWithQuotes(token.value);
    token.value = newTokenValue;
  }
};

exports.nodeBefore = function(node) {
  if (disabled || !normalizeObjectKeys) return;

  if (node.type === 'ObjectExpression') {
    node.properties.forEach(function(property) {
      if (property.key.type === 'Identifier') {
        // Literal = The key isn't quoted yet, convert to a Literal.
        property.key.value = property.key.name;
        delete property.key.name;
        property.key.type = 'Literal';
      }

      property.key.startToken.value = getNormalizedStringWithQuotes(property.key.startToken.value);
      property.key.endToken.value   = getNormalizedStringWithQuotes(property.key.endToken.value);

      property.key.startToken.type = property.key.endToken.type = 'String';
    });
  }
}

function getNormalizedStringWithQuotes(string) {
  var content;
  if (string.charAt(0) === DOUBLE_QUOTE || string.charAt(0) === SINGLE_QUOTE) {
    content = string.substr(1, string.length - 2);
  }
  else {
    content = string;
  }

  var quote = quoteValue;
  var alternate = alternateQuote;

  var shouldAvoidEscape = avoidEscape &&
    content.indexOf(quote) >= 0 &&
    content.indexOf(alternate) < 0;

  if (shouldAvoidEscape) {
    alternate = quoteValue;
    quote = alternateQuote;
  }

  // we always normalize the behavior to remove unnecessary escapes
  var alternateEscape = new RegExp('\\\\' + alternate, 'g');
  content = content.replace(alternateEscape, alternate);

  var quoteEscape = new RegExp('([^\\\\])' + quote, 'g');
  content = content.replace(quoteEscape, '$1\\' + quote);

  return quote + content + quote;
}
