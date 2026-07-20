import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const ZERO_NETWORK_GUARD_METHODS = Object.freeze([
  "fetch",
  "http.request",
  "http.get",
  "https.request",
  "https.get",
  "net.connect",
  "net.createConnection",
  "tls.connect",
  "dns.lookup",
  "dns.resolve",
  "dns.resolve4",
  "dns.resolve6",
  "dns.resolveAny",
  "dns.reverse",
  "dns.promises.lookup",
  "dns.promises.resolve",
  "dns.promises.resolve4",
  "dns.promises.resolve6",
  "dns.promises.resolveAny",
  "dns.promises.reverse",
]);

export function installZeroNetworkGuard({
  allowLoopback = false,
  errorPrefix = "test_external_network_forbidden",
  onBlockedAttempt = null,
} = {}) {
  const attempts = [];
  const restores = [];
  let restored = false;
  const modules = {
    http: require("node:http"),
    https: require("node:https"),
    net: require("node:net"),
    tls: require("node:tls"),
    dns: require("node:dns"),
  };

  patch(globalThis, "fetch", "fetch");
  for (const [moduleName, methods] of Object.entries({
    http: ["request", "get"],
    https: ["request", "get"],
    net: ["connect", "createConnection"],
    tls: ["connect"],
    dns: ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"],
  })) {
    for (const method of methods) {
      patch(modules[moduleName], method, `${moduleName}.${method}`);
    }
  }
  const dnsPromises = modules.dns.promises;
  if (dnsPromises) {
    for (const method of [
      "lookup",
      "resolve",
      "resolve4",
      "resolve6",
      "resolveAny",
      "reverse",
    ]) {
      patch(dnsPromises, method, `dns.promises.${method}`);
    }
  }

  return {
    attempts,
    guarded_methods: ZERO_NETWORK_GUARD_METHODS,
    restore() {
      if (restored) return;
      restored = true;
      restores.reverse().forEach((restore) => restore());
    },
  };

  function patch(target, method, label) {
    const original = target[method];
    if (typeof original !== "function") return;
    target[method] = (...args) => {
      if (allowLoopback && isExactLoopbackCall(label, args)) {
        return Reflect.apply(original, target, args);
      }
      const attempt = Object.freeze({ method: label });
      attempts.push(attempt);
      onBlockedAttempt?.(attempt);
      const error = new Error(`${errorPrefix}:${label}`);
      error.code = "test_external_network_forbidden";
      error.network_method = label;
      throw error;
    };
    restores.push(() => {
      target[method] = original;
    });
  }
}

function isExactLoopbackCall(label, args) {
  if (label === "fetch") {
    const first = args[0];
    if (first instanceof URL) return isLoopbackHost(first.hostname);
    if (typeof first === "string") {
      try {
        return isLoopbackHost(new URL(first).hostname);
      } catch {
        return false;
      }
    }
    if (first && typeof first === "object" && typeof first.url === "string") {
      try {
        return isLoopbackHost(new URL(first.url).hostname);
      } catch {
        return false;
      }
    }
    return false;
  }
  if (label.startsWith("dns.")) {
    return isLoopbackHost(args[0]);
  }
  if (label.startsWith("http.")) {
    const first = args[0];
    if (first instanceof URL) return isLoopbackHost(first.hostname);
    if (typeof first === "string") {
      try {
        return isLoopbackHost(new URL(first).hostname);
      } catch {
        return false;
      }
    }
    if (first && typeof first === "object") {
      return isLoopbackHost(first.hostname ?? first.host);
    }
    return false;
  }
  if (label.startsWith("net.")) {
    const first = args[0];
    if (first && typeof first === "object") {
      return isLoopbackHost(first.host);
    }
    return isLoopbackHost(args[1]);
  }
  return false;
}

function isLoopbackHost(value) {
  return (
    value === "127.0.0.1" ||
    value === "::1" ||
    value === "[::1]" ||
    value === "localhost"
  );
}
