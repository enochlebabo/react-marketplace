/**
 * Extracts a URL parameter from the current URL
 * Works with both query strings (?param=value) and hash-based routing (#/?param=value)
 */
export function getUrlParameter(paramName: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const regularParam = urlParams.get(paramName);

  if (regularParam !== null) {
    return regularParam;
  }

  const hash = window.location.hash;
  const queryStartIndex = hash.indexOf("?");

  if (queryStartIndex !== -1) {
    const hashQuery = hash.substring(queryStartIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    return hashParams.get(paramName);
  }

  return null;
}

function storeSessionParameter(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function getSessionParameter(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function clearParamFromHash(paramName: string): void {
  if (!window.history.replaceState) return;

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;

  const hashContent = hash.substring(1);
  const queryStartIndex = hashContent.indexOf("?");
  if (queryStartIndex === -1) return;

  const routePath = hashContent.substring(0, queryStartIndex);
  const queryString = hashContent.substring(queryStartIndex + 1);

  const params = new URLSearchParams(queryString);
  params.delete(paramName);

  const newQueryString = params.toString();
  let newHash = routePath;
  if (newQueryString) {
    newHash += `?${newQueryString}`;
  }

  const newUrl =
    window.location.pathname +
    window.location.search +
    (newHash ? `#${newHash}` : "");
  window.history.replaceState(null, "", newUrl);
}

/**
 * Gets a secret parameter from hash → sessionStorage fallback.
 * Clears from URL after extraction for security.
 */
export function getSecretParameter(paramName: string): string | null {
  const existing = getSessionParameter(paramName);
  if (existing !== null) return existing;

  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return null;

  const hashContent = hash.substring(1);
  const params = new URLSearchParams(hashContent);
  const secret = params.get(paramName);

  if (secret) {
    storeSessionParameter(paramName, secret);
    clearParamFromHash(paramName);
    return secret;
  }

  return null;
}
