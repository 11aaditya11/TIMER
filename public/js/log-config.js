(function (factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof globalThis !== 'undefined' ? globalThis : global);
  } else {
    factory(typeof window !== 'undefined' ? window : this);
  }
})(function (root) {
  const noop = function () {};
  const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'table', 'dir'];
  const rootConsole = root && root.console;
  const originalMethods = new Map();

  const parseBoolean = (value) => {
    if (value == null) return null;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enable', 'enabled'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(normalized)) return false;
    return null;
  };

  const resolveEnvSetting = () => {
    const sourceProcess = typeof process !== 'undefined' ? process : root && root.process;
    if (sourceProcess && sourceProcess.env) {
      const explicit = sourceProcess.env.TIMER_LOG ?? sourceProcess.env.LOG ?? sourceProcess.env.DEBUG_LOG;
      const parsed = parseBoolean(explicit);
      if (parsed !== null) {
        return parsed;
      }
    }
    if (root && root.localStorage) {
      try {
        const stored = root.localStorage.getItem('timer-log');
        const parsed = parseBoolean(stored);
        if (parsed !== null) {
          return parsed;
        }
      } catch (_) {
        // Ignore storage access errors (e.g., privacy modes)
      }
    }
    return null;
  };

  const captureOriginals = () => {
    if (!rootConsole || typeof rootConsole !== 'object') return;
    methods.forEach((method) => {
      if (!originalMethods.has(method) && typeof rootConsole[method] === 'function') {
        originalMethods.set(method, rootConsole[method]);
      }
    });
  };

  const assignConsoleMethod = (method, fn) => {
    if (!rootConsole) return;
    try {
      rootConsole[method] = fn;
    } catch (_) {
      try {
        Object.defineProperty(rootConsole, method, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: fn,
        });
      } catch (__) {
        // Ignore inability to redefine console methods
      }
    }
  };

  let log = (() => {
    const envSetting = resolveEnvSetting();
    if (envSetting !== null) {
      return envSetting;
    }
    return false;
  })();

  const applyLogMode = () => {
    if (!rootConsole || typeof rootConsole !== 'object') return;
    captureOriginals();
    methods.forEach((method) => {
      const original = originalMethods.get(method) || rootConsole[method];
      if (log) {
        assignConsoleMethod(method, original || noop);
      } else {
        assignConsoleMethod(method, noop);
      }
    });
  };

  const persistSetting = (value) => {
    if (!root || !root.localStorage) return;
    try {
      root.localStorage.setItem('timer-log', value ? 'true' : 'false');
    } catch (_) {
      // Ignore storage access issues
    }
  };

  const normalizeValue = (value) => {
    if (typeof value === 'boolean') return value;
    const parsed = parseBoolean(value);
    if (parsed !== null) return parsed;
    return !!value;
  };

  const setLog = (nextValue) => {
    const normalized = normalizeValue(nextValue);
    if (normalized === log) return log;
    log = normalized;
    applyLogMode();
    persistSetting(log);
    return log;
  };

  const toggleLog = () => setLog(!log);

  const exposeHelpers = (target = root) => {
    if (!target) return;
    try {
      Object.defineProperties(target, {
        log: {
          configurable: true,
          enumerable: true,
          get: () => log,
          set: (value) => {
            setLog(value);
          },
        },
        setLog: {
          configurable: true,
          enumerable: false,
          writable: true,
          value: setLog,
        },
        toggleLog: {
          configurable: true,
          enumerable: false,
          writable: true,
          value: toggleLog,
        },
      });
    } catch (_) {
      try { target.log = log; } catch (__) {}
      try { target.setLog = setLog; } catch (__) {}
      try { target.toggleLog = toggleLog; } catch (__) {}
    }
  };

  const silenceConsole = () => setLog(false);
  const exposeLog = exposeHelpers;

  exposeHelpers(root);
  applyLogMode();

  return {
    get log() {
      return log;
    },
    setLog,
    toggleLog,
    silenceConsole,
    exposeLog,
    applyLogMode,
  };
});
