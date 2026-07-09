function providerError(name, err) {
  if (!err.response) return err;
  const detail = err.response.data?.error?.message || err.response.data?.message || err.response.statusText || err.message;
  const out = new Error(`${name} ${err.response.status}: ${detail}`);
  out.status = err.response.status;
  return out;
}

module.exports = { providerError };
