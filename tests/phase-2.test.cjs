const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { environment, mountCollection } = require('./helpers.cjs');

test('profile validation trims fields and rejects invalid goals, oversized bios and avatars', () => {
  const { validateProfile } = environment().load('@/lib/profile-fields');
  const value = {
    display_name: '  Learner  ',
    avatar_key: 'sprout',
    target_level: 'TOPIK II Level 4',
    daily_goal: 5,
    bio: '',
    korean_background: '',
  };
  assert.equal(validateProfile(value).display_name, 'Learner');
  for (const patch of [
    { daily_goal: 0 },
    { daily_goal: 1.5 },
    { daily_goal: 21 },
    { bio: 'x'.repeat(301) },
    { avatar_key: 'unknown' },
    { display_name: ' ' },
  ])
    assert.throws(() => validateProfile({ ...value, ...patch }));
});

test('statements round-trip all four sections and keep old section-only writing', () => {
  const { statementDocument, restoreStatement, restoreStatementStep } = environment().load(
    '@/lib/statement-document',
  );
  const sections = { background: 'A', motivation: 'B', study_plan: 'C', future_goals: 'D' };
  const draft = statementDocument(randomUUID(), 'University', 'Major', sections, 2);
  assert.deepEqual(restoreStatement(draft), sections);
  assert.equal(restoreStatementStep(draft), 2);
  assert.equal(draft.content, 'A\n\nB\n\nC\n\nD');
  assert.equal(
    restoreStatement({
      content: 'Legacy writing',
      title: 'University - Major (Motivation for Applying)',
    }).motivation,
    'Legacy writing',
  );
  assert.equal(restoreStatementStep({ metadata: { currentStep: 'invalid' } }), 0);
});

test('statement sync includes metadata, and paused account writes cannot recreate deleted drafts', async (t) => {
  const remote = new Map();
  let rpcName;
  const supabase = {
    async rpc(name, body) {
      rpcName = name;
      remote.set(body.draft_id, {
        id: body.draft_id,
        type: body.draft_type,
        title: body.draft_title,
        content: body.draft_content,
        char_count: body.draft_char_count,
        updated_at: body.draft_updated_at,
        metadata: body.draft_metadata,
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
          resolve({ data: table === 'drafts' ? [...remote.values()] : [] });
        },
      };
    },
  };
  const mounted = mountCollection(supabase, 'a');
  t.after(mounted.unmount);
  let collection = await mounted.waitFor((value) => value.syncStatus === 'synced');
  const draft = {
    id: randomUUID(),
    type: 'statement',
    title: 'Statement',
    content: 'Writing',
    charCount: 7,
    metadata: {
      sections: {
        background: 'Writing',
        motivation: 'More',
        study_plan: 'Plan',
        future_goals: 'Goals',
      },
      currentStep: 3,
    },
  };
  await collection.saveDraft(draft, { deferSync: true });
  assert.equal(rpcName, undefined);
  await collection.retrySync();
  collection = mounted.render();
  assert.equal(rpcName, 'save_draft_document');
  assert.deepEqual(collection.drafts[0].metadata, draft.metadata);
  await collection.pauseWrites();
  await assert.rejects(collection.saveDraft({ ...draft, content: 'Late autosave' }));
  assert.equal(mounted.render().drafts[0].content, 'Writing');
  collection.resumeWrites();
  await collection.saveDraft(draft, { deferSync: true });
});

test('local deletion is account-specific and remote failures never report successful deletion', async () => {
  const env = environment({
    '@/lib/supabase': {
      supabase: { functions: { invoke: async () => ({ error: new Error('offline') }) } },
    },
  });
  env.storage.getAllKeys = async () => [...env.values.keys()];
  env.storage.multiRemove = async (keys) => keys.forEach((key) => env.values.delete(key));
  const { accountKey } = env.load('@/lib/account-storage');
  env.values.set(accountKey('drafts', 'a'), 'private');
  env.values.set(accountKey('drafts', 'b'), 'other');
  env.values.set(accountKey('drafts'), 'guest');
  const { deleteRemoteAccount, removeLocalAccount } = env.load('@/services/account-service');
  await assert.rejects(deleteRemoteAccount('password', 'DELETE'));
  assert.equal(env.values.get(accountKey('drafts', 'a')), 'private');
  await removeLocalAccount('a');
  assert.equal(env.values.has(accountKey('drafts', 'a')), false);
  assert.equal(env.values.get(accountKey('drafts', 'b')), 'other');
  assert.equal(env.values.get(accountKey('drafts')), 'guest');
});

test('account deletion verifies the caller password and ignores supplied target identities', async () => {
  const previousDeno = global.Deno;
  let handler;
  let passwordMatches = false;
  const deleted = [];
  const admin = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'caller', email: 'caller@example.test' } } }),
      admin: {
        deleteUser: async (id) => {
          deleted.push(id);
          return {};
        },
      },
    },
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      single: async () => ({ data: { role: 'user' } }),
    }),
  };
  const verifier = {
    auth: {
      signInWithPassword: async (value) => {
        assert.equal(value.email, 'caller@example.test');
        return passwordMatches ? { data: { user: { id: 'caller' } } } : { error: {}, data: {} };
      },
    },
  };
  global.Deno = {
    env: { get: (name) => name },
    serve: (callback) => {
      handler = callback;
    },
  };
  try {
    environment({
      'npm:@supabase/supabase-js@2.118.0': {
        createClient: (url, key) => (key === 'SUPABASE_SERVICE_ROLE_KEY' ? admin : verifier),
      },
    }).load('supabase/functions/delete-account/index.ts');
    const request = () =>
      new Request('https://example.test', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: JSON.stringify({
          password: 'current-password',
          confirmation: 'DELETE',
          userId: 'victim',
          email: 'victim@example.test',
        }),
      });
    assert.equal((await handler(request())).status, 403);
    assert.equal(deleted.length, 0);
    passwordMatches = true;
    assert.equal((await handler(request())).status, 200);
    assert.deepEqual(deleted, ['caller']);
  } finally {
    global.Deno = previousDeno;
  }
});

test('writing recovery persists each edit locally, retries failed saves and flushes on background', async () => {
  const React = require('react');
  const slots = [];
  let cursor = 0;
  let effects = [];
  let guard;
  let appState;
  let fail = false;
  const writes = [];
  const alerts = [];
  const hooks = {
    ...React,
    useState(initial) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[id],
        (value) => {
          slots[id] = typeof value === 'function' ? value(slots[id]) : value;
        },
      ];
    },
    useRef(initial) {
      const id = cursor++;
      if (!(id in slots)) slots[id] = { current: initial };
      return slots[id];
    },
    useEffect(effect, deps) {
      const id = cursor++;
      const previous = slots[id];
      if (!previous || !deps || deps.some((value, index) => value !== previous.deps?.[index]))
        effects.push(() => {
          previous?.cleanup?.();
          slots[id] = { deps, cleanup: effect() };
        });
    },
  };
  const api = {
    saveDraft: async (draft, options) => {
      assert.equal(options.deferSync, true);
      if (fail) throw new Error('Device full');
      writes.push(draft);
    },
    retrySync: async () => {},
  };
  const env = environment({
    react: hooks,
    '@/context/saved-context': { useSaved: () => api },
    'expo-router': {
      usePreventRemove: (blocked, callback) => {
        guard = { blocked, callback };
      },
    },
    'react-native': {
      Alert: { alert: (...args) => alerts.push(args) },
      AppState: {
        addEventListener: (name, callback) => {
          appState = callback;
          return { remove() {} };
        },
      },
    },
  });
  const { useWritingRecovery } = env.load('@/hooks/use-writing-recovery');
  const render = () => {
    cursor = 0;
    effects = [];
    const result = useWritingRecovery();
    effects.forEach((effect) => effect());
    return result;
  };
  try {
    let recovery = render();
    const draft = { id: randomUUID(), type: 'Q53', title: 'Draft', content: 'first', charCount: 5 };
    recovery.update(draft);
    recovery.update({ ...draft, content: 'latest' });
    await new Promise((resolve) => setImmediate(resolve));
    recovery = render();
    assert.equal(writes.at(-1).content, 'latest');
    assert.equal(recovery.status, 'saved');
    fail = true;
    recovery.update({ ...draft, content: 'unsaved' });
    await new Promise((resolve) => setImmediate(resolve));
    recovery = render();
    assert.equal(guard.blocked, true);
    let repeated = false;
    guard.callback({
      repeat: () => {
        repeated = true;
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(repeated, false);
    assert.equal(alerts.length, 1);
    fail = false;
    appState('background');
    await new Promise((resolve) => setImmediate(resolve));
    recovery = render();
    assert.equal(recovery.status, 'saved');
    assert.equal(writes.at(-1).content, 'unsaved');
  } finally {
    slots.forEach((slot) => slot?.cleanup?.());
  }
});

test('account deletion drains active device writes and blocks late work from other services', async () => {
  let finish;
  const disk = new Map();
  const storage = {
    setItem: (key, value) =>
      new Promise((resolve) => {
        finish = () => {
          disk.set(key, value);
          resolve();
        };
      }),
  };
  const env = environment({ '@react-native-async-storage/async-storage': storage });
  const { setAccountItem, pauseAccountWrites, resumeAccountWrites, accountKey } =
    env.load('@/lib/account-storage');
  const writing = setAccountItem('draft', 'private', 'a');
  let paused = false;
  const pause = pauseAccountWrites('a').then(() => {
    paused = true;
  });
  await assert.rejects(setAccountItem('late-review', 'private', 'a'));
  assert.equal(paused, false);
  finish();
  await writing;
  await pause;
  assert.equal(paused, true);
  disk.delete(accountKey('draft', 'a'));
  await assert.rejects(setAccountItem('late-ai-result', 'private', 'a'));
  assert.equal(disk.size, 0);
  resumeAccountWrites('a');
});

test('finishing interrupted deletion preserves a different account session and guest writing', async () => {
  let signedOut = false;
  const env = environment({
    '@/lib/supabase': {
      AUTH_STORAGE_KEY: 'auth-key',
      supabase: {
        auth: {
          getSession: async () => ({ data: { session: { user: { id: 'b' } } } }),
          signOut: async () => {
            signedOut = true;
          },
        },
      },
    },
  });
  env.storage.getAllKeys = async () => [...env.values.keys()];
  env.storage.multiRemove = async (keys) => keys.forEach((key) => env.values.delete(key));
  const { accountKey } = env.load('@/lib/account-storage');
  const { completeLocalDeletion, DELETION_CLEANUP_KEY } = env.load('@/services/account-service');
  env.values.set(accountKey('draft', 'a'), 'private');
  env.values.set(accountKey('draft', 'b'), 'other');
  env.values.set(accountKey('draft'), 'guest');
  env.values.set('auth-key', 'session-b');
  env.values.set('@vocabjip/user_profile', JSON.stringify({ id: 'b' }));
  env.values.set(DELETION_CLEANUP_KEY, 'a');
  await completeLocalDeletion('a');
  assert.equal(signedOut, false);
  assert.equal(env.values.get('auth-key'), 'session-b');
  assert.equal(env.values.get(accountKey('draft')), 'guest');
  assert.equal(env.values.has(accountKey('draft', 'a')), false);
  assert.equal(env.values.has(DELETION_CLEANUP_KEY), false);
});
