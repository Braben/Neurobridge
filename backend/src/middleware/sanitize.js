// Request body sanitization for JSON routes.
// Trims strings and blocks prototype/operator keys that should never be user input.
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype", "$where"]);

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((safe, [key, entryValue]) => {
      if (BLOCKED_KEYS.has(key) || key.startsWith("$")) {
        return safe;
      }
      safe[key] = sanitizeValue(entryValue);
      return safe;
    }, {});
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return value;
}

exports.sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
