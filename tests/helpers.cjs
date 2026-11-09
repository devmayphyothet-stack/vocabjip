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

module.exports = { environment, mountCollection };
