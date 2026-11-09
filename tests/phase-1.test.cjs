const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');

function environment(extra = {}) {
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
  const cache = new Map();
  const overrides = {
    '@react-native-async-storage/async-storage': storage,
    'expo-crypto': { randomUUID },
    'react-native': {
      Platform: { OS: 'web' },
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    ...extra,
  };
  function load(name) {
    if (name in overrides) return overrides[name];
    const file = path.resolve(name.startsWith('@/') ? `src/${name.slice(2)}` : name);
    const resolved = ['.ts', '.tsx', '']
      .map((ext) => file + ext)
      .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!resolved) return require(name);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    new Function('require', 'module', 'exports', source)(load, module, module.exports);
    return module.exports;
  }
  return { load, storage, values };
}

const sampleEvaluation = () => ({
  estimatedScore: 20,
  overallSummary: 'Feedback',
  structureRating: { score: 7, max: 10, comment: 'Structure' },
  contentRating: { score: 7, max: 10, comment: 'Content' },
  languageRating: { score: 6, max: 10, comment: 'Language' },
  strengths: [],
  improvements: ['Revise'],
  grammarCorrections: [],
  vocabularySuggestions: [],
});

test('AI evaluation rejects incomplete, out-of-range, and inconsistent scores; accepts zero', () => {
  const { validateEssayEvaluation } = environment().load('@/lib/ai-validation');
  assert.equal(validateEssayEvaluation(sampleEvaluation(), 'Q53'), true);
  for (const value of [
    {},
    { ...sampleEvaluation(), estimatedScore: 30 },
    { ...sampleEvaluation(), grammarCorrections: [{}] },
    { ...sampleEvaluation(), languageRating: { score: -1, max: 10, comment: 'Bad' } },
  ])
    assert.equal(validateEssayEvaluation(value, 'Q53'), false);
  const zero = sampleEvaluation();
  zero.estimatedScore = 0;
  for (const key of ['structureRating', 'contentRating', 'languageRating']) zero[key].score = 0;
  assert.equal(validateEssayEvaluation(zero, 'Q53'), true);
});

test('draft merge preserves newer local writing and honors deletions', () => {
  const { mergeDrafts, createDraftId, isUuid } = environment().load('@/lib/draft-utils');
  const newer = { id: 'one', updatedAt: '2026-11-09T12:00:00Z', content: 'new' };
  const older = { ...newer, updatedAt: '2026-11-08T12:00:00Z', content: 'old' };
  assert.deepEqual(mergeDrafts([newer], [older]), [newer]);
  assert.deepEqual(mergeDrafts([newer], [older], ['one']), []);
  assert.equal(isUuid(createDraftId()), true);
});

test('legacy migration attributes data to its previous owner and never the next login', async () => {
  const env = environment();
  env.values.set('@vocabjip/user_profile', JSON.stringify({ id: 'previous' }));
  env.values.set('@vocabjip/saved_drafts', '[{"content":"private"}]');
  const { migrateLegacyStorage, accountKey } = env.load('@/lib/account-storage');
  await migrateLegacyStorage();
  assert.equal(
    env.values.get(accountKey('@vocabjip/saved_drafts', 'previous')),
    '[{"content":"private"}]',
  );
  assert.equal(env.values.has(accountKey('@vocabjip/saved_drafts', 'next')), false);
  assert.equal(env.values.has('@vocabjip/saved_drafts'), false);
  await migrateLegacyStorage();
  assert.equal(
    env.values.get(accountKey('@vocabjip/saved_drafts', 'previous')),
    '[{"content":"private"}]',
  );
});

test('OCR failures and missing credentials never produce simulated writing', async () => {
  const { extractKoreanHandwriting } = environment({
    '@/services/gemini-service': {
      callGeminiGenerateContent: async () => ({ ok: false }),
      extractGeminiText: () => null,
    },
  }).load('@/services/ocr-service');
  for (const [image, key] of [
    ['', 'key'],
    ['image', null],
    ['image', 'key'],
  ]) {
    const result = await extractKoreanHandwriting(image, key);
    assert.equal(result.success, false);
    assert.equal(result.result, undefined);
  }
});

test('review delivery stays queued offline, retries with the same ID, and filters account history', async () => {
  let online = false;
  const remote = new Map();
  const supabase = {
    from: () => {
      let id;
      let owner;
      let inserted;
      const query = {
        select() {
          return this;
        },
        eq(key, value) {
          if (key === 'id') id = value;
          if (key === 'student_id') owner = value;
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        insert(value) {
          inserted = value;
          return this;
        },
        async single() {
          if (!online) return { error: {} };
          remote.set(inserted.id, inserted);
          return { data: inserted };
        },
        async maybeSingle() {
          return online ? { data: remote.get(id) || null } : { error: {} };
        },
        then(resolve) {
          resolve(
            online
              ? { data: [...remote.values()].filter((item) => item.student_id === owner) }
              : { error: {} },
          );
        },
      };
      return query;
    },
  };
  const env = environment({ '@/lib/supabase': { supabase } });
  const { EssayReviewService } = env.load('@/services/essay-review-service');
  const sent = await EssayReviewService.submitEssayForContributorReview({
    userId: 'a',
    essayText: 'My essay',
    promptTopic: 'Topic',
    questionType: 'Q53',
  });
  assert.equal(sent.deliveryStatus, 'queued');
  assert.equal(remote.size, 0);
  assert.deepEqual(await EssayReviewService.getMySubmissions('b'), []);
  online = true;
  const retried = await EssayReviewService.getMySubmissions('a');
  assert.equal(retried[0].id, sent.id);
  assert.equal(retried[0].deliveryStatus, 'sent');
  assert.equal(remote.size, 1);
  await EssayReviewService.getMySubmissions('a');
  assert.equal(remote.size, 1);
});

test('proxy rejects malformed input and stops retrying quota failures', async () => {
  const handler = require('../api/gemini.js');
  let calls = 0;
  const previous = global.fetch;
  global.fetch = async () => {
    calls++;
    return { ok: false, status: 429, json: async () => ({ error: { message: 'Quota reached' } }) };
  };
  const response = () => ({
    setHeader() {},
    status(code) {
      this.code = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  });
  try {
    const bad = response();
    await handler({ method: 'POST', body: { apiKey: {} } }, bad);
    assert.equal(bad.code, 400);
    assert.equal(calls, 0);
    const quota = response();
    await handler({ method: 'POST', body: { apiKey: 'test', payload: { contents: [] } } }, quota);
    assert.equal(quota.code, 429);
    assert.equal(calls, 1);
  } finally {
    global.fetch = previous;
  }
});

test('streak updates stay isolated across accounts, including concurrent offline activity', async () => {
  const env = environment({
    '@/lib/supabase': {
      supabase: {
        from: () => ({
          update: () => ({
            eq: async () => {
              throw new Error('offline');
            },
          }),
        }),
      },
    },
  });
  const { StreakService } = env.load('@/services/streak-service');
  const updates = [];
  const unsubscribe = StreakService.subscribe((state) => updates.push(state.dailyCompleted), 'a');
  await Promise.all([
    StreakService.recordActivity('a'),
    StreakService.recordActivity('a'),
    StreakService.recordActivity('b'),
  ]);
  assert.equal(StreakService.getState('a').dailyCompleted, 2);
  assert.equal(StreakService.getState('b').dailyCompleted, 1);
  assert.equal(updates.at(-1), 2);
  assert.equal(StreakService.getState().dailyCompleted, 0);
  unsubscribe();
});

test('shared dictionary requires a valid session and never returns the system key', async () => {
  let handler;
  let authenticated = false;
  let allowed = true;
  let lookups = 0;
  const previousDeno = global.Deno;
  const previousFetch = global.fetch;
  const serverClient = {
    auth: {
      getUser: async () =>
        authenticated ? { data: { user: { id: 'user-a' } } } : { data: {}, error: {} },
    },
    rpc: async () => ({ data: allowed }),
    from(table) {
      const query = {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        upsert: async () => ({}),
        maybeSingle: async () =>
          table === 'app_settings'
            ? {
                data: {
                  value: {
                    primary_key: 'PRIVATE-KEY',
                    enabled: true,
                    model: 'gemini-flash-lite-latest',
                  },
                },
              }
            : { data: null },
      };
      return query;
    },
  };
  global.Deno = {
    env: { get: () => 'server-only' },
    serve: (callback) => {
      handler = callback;
    },
  };
  global.fetch = async (url, options) => {
    lookups++;
    assert.equal(options.headers['x-goog-api-key'], 'PRIVATE-KEY');
    assert.equal(url.includes('PRIVATE-KEY'), false);
    return Response.json({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify({ rootWord: 'word', myanmarMeaning: 'meaning' }) }],
          },
        },
      ],
    });
  };
  try {
    environment({ 'npm:@supabase/supabase-js@2.118.0': { createClient: () => serverClient } }).load(
      'supabase/functions/vocab-lens/index.ts',
    );
    const request = () =>
      new Request('https://example.test', {
        method: 'POST',
        headers: { Authorization: 'Bearer user-token' },
        body: JSON.stringify({ word: 'word', stem: 'word' }),
      });
    assert.equal((await handler(request())).status, 401);
    assert.equal(lookups, 0);
    authenticated = true;
    allowed = false;
    assert.equal((await handler(request())).status, 429);
    assert.equal(lookups, 0);
    allowed = true;
    const response = await handler(request());
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.equal(body.includes('PRIVATE-KEY'), false);
    assert.equal(JSON.parse(body).definition.myanmarMeaning, 'meaning');
  } finally {
    global.Deno = previousDeno;
    global.fetch = previousFetch;
  }
});

function mountCollection(supabase, userId) {
  const React = require('react');
  const slots = [];
  let cursor = 0;
  let effects = [];
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === 'function' ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const env = environment({
    react: hooks,
    '@/lib/supabase': { supabase, isSupabaseConfigured: true },
    '@/context/auth-context': { useAuth: () => ({ user: userId ? { id: userId } : null }) },
  });
  const { SavedProvider } = env.load('@/context/saved-context');
  const render = () => {
    cursor = 0;
    effects = [];
    const element = SavedProvider({ children: null });
    const pending = effects;
    effects = [];
    pending.forEach((effect) => effect());
    return element?.props?.value;
  };
  const waitFor = async (predicate) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const value = render();
      if (value && predicate(value)) return value;
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    throw new Error('Collection did not settle');
  };
  return { env, render, waitFor, unmount: () => slots.forEach((slot) => slot?.cleanup?.()) };
}

test('collection keeps offline saves, recovers stale conflicts, and retries deletes without resurrection', async (t) => {
  let online = false;
  const remote = new Map();
  const supabase = {
    async rpc(name, body) {
      if (!online) return { error: {} };
      const previous = remote.get(body.draft_id);
      if (previous && Date.parse(previous.updated_at) > Date.parse(body.draft_updated_at))
        return { data: false };
      remote.set(body.draft_id, {
        id: body.draft_id,
        type: body.draft_type,
        title: body.draft_title,
        content: body.draft_content,
        char_count: body.draft_char_count,
        updated_at: body.draft_updated_at,
      });
      return { data: true };
    },
    from(table) {
      let deleting = false;
      let id;
      const query = {
        select() {
          return this;
        },
        delete() {
          deleting = true;
          return this;
        },
        eq(key, value) {
          if (key === 'id') id = value;
          return this;
        },
        then(resolve) {
          if (!online) return resolve({ error: {} });
          if (deleting) remote.delete(id);
          resolve({ data: table === 'drafts' ? [...remote.values()] : [] });
        },
      };
      return query;
    },
  };
  const mounted = mountCollection(supabase, 'account-a');
  t.after(mounted.unmount);
  let collection = await mounted.waitFor((value) => value.syncStatus === 'error');
  const id = randomUUID();
  await collection.saveDraft({
    id,
    type: 'Q53',
    title: 'My draft',
    content: 'offline writing',
    charCount: 15,
  });
  collection = await mounted.waitFor(
    (value) => value.syncStatus === 'error' && value.drafts.length === 1,
  );
  const durable = [...mounted.env.values.entries()].find(([key]) => key.includes('collection_v1'));
  assert.equal(JSON.parse(durable[1]).drafts[0].content, 'offline writing');
  remote.set(id, {
    id,
    type: 'Q53',
    title: 'Cloud draft',
    content: 'newer cloud writing',
    char_count: 19,
    updated_at: '2099-01-01T00:00:00Z',
  });
  online = true;
  await collection.retrySync();
  collection = mounted.render();
  assert.equal(collection.drafts.length, 2);
  assert.equal(collection.drafts.find((draft) => draft.id === id).content, 'newer cloud writing');
  assert.equal(collection.drafts.find((draft) => draft.id !== id).content, 'offline writing');
  await collection.retrySync();
  collection = mounted.render();
  assert.equal(collection.syncStatus, 'synced');
  assert.equal(remote.size, 2);
  online = false;
  await collection.deleteDraft(id);
  collection = await mounted.waitFor(
    (value) => value.syncStatus === 'error' && value.drafts.length === 1,
  );
  online = true;
  await collection.retrySync();
  collection = mounted.render();
  assert.equal(remote.has(id), false);
  assert.equal(
    collection.drafts.some((draft) => draft.id === id),
    false,
  );
});

test('a slow cloud read cannot block local saving or overwrite a newer local edit', async (t) => {
  let block = false;
  let unblock;
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const remote = new Map();
  const supabase = {
    async rpc(name, body) {
      remote.set(body.draft_id, {
        id: body.draft_id,
        type: body.draft_type,
        title: body.draft_title,
        content: body.draft_content,
        char_count: body.draft_char_count,
        updated_at: body.draft_updated_at,
      });
      return { data: true };
    },
    from(table) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        then(resolve) {
          if (block && table === 'drafts') {
            block = false;
            markStarted();
            unblock = () => resolve({ data: [] });
            return;
          }
          resolve({ data: table === 'drafts' ? [...remote.values()] : [] });
        },
      };
    },
  };
  const mounted = mountCollection(supabase, 'account-a');
  t.after(mounted.unmount);
  const collection = await mounted.waitFor((value) => value.syncStatus === 'synced');
  block = true;
  const syncing = collection.retrySync();
  await started;
  const id = randomUUID();
  try {
    await Promise.race([
      collection.saveDraft({
        id,
        type: 'Q53',
        title: 'New draft',
        content: 'new writing',
        charCount: 11,
      }),
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Cloud read blocked local saving')), 500);
        timeout.unref();
      }),
    ]);
    assert.equal(mounted.render().drafts[0].content, 'new writing');
  } finally {
    unblock();
  }
  await syncing;
  const updated = await mounted.waitFor((value) => value.syncStatus === 'synced');
  assert.equal(updated.drafts[0].content, 'new writing');
  assert.equal(remote.get(id).content, 'new writing');
});
