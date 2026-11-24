import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { translateTexts } from './flittoApi.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('posts translation requests to the same-origin server without credentials', async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ data: { contents: ['Hello'] } }),
    };
  };

  assert.deepEqual(await translateTexts(['안녕하세요'], 'en'), ['Hello']);
  assert.equal(request.url, '/api/flitto/translate');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(request.options.body), {
    texts: ['안녕하세요'],
    targetLang: 'en',
  });
});

test('returns Korean text without making a network request', async () => {
  globalThis.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  assert.deepEqual(await translateTexts(['안녕하세요'], 'ko'), ['안녕하세요']);
});

test('falls back to source text when the server request fails', async () => {
  globalThis.fetch = async () => {
    throw new Error('network failure');
  };

  assert.deepEqual(await translateTexts(['안녕하세요'], 'ja'), ['안녕하세요']);
});
