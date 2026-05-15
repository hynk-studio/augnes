import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const fakeIssuer = "Iv1.fake-client-or-app-id";
const malformedFakeKey = "not-a-valid-fake-test-key";
const fixedNow = new Date("2026-05-15T00:00:00.000Z");
const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-app-jwt-"));
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("GitHub App JWT fixture smoke must not call fetch.");
};

try {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const fakePrivateKeyPem = privateKey.export({
    format: "pem",
    type: "pkcs8",
  });
  const fakePublicKeyPem = publicKey.export({
    format: "pem",
    type: "spki",
  });

  assert.equal(typeof fakePrivateKeyPem, "string");
  assert.equal(typeof fakePublicKeyPem, "string");

  const {
    createGitHubAppJwt,
    redactGitHubAppJwtForResponse,
  } = await import("../lib/github-app-jwt.ts");

  const result = createGitHubAppJwt({
    issuer: fakeIssuer,
    privateKeyPem: fakePrivateKeyPem,
    now: fixedNow,
  });
  const nowSeconds = Math.floor(fixedNow.getTime() / 1000);
  const segments = result.jwt.split(".");
  assert.equal(segments.length, 3, "JWT should have three dot-separated segments");
  assert.notEqual(segments[2], "", "JWT signature segment should be present");

  const decodedHeader = decodeJsonSegment(segments[0]);
  assert.deepEqual(
    decodedHeader,
    { alg: "RS256", typ: "JWT" },
    "JWT header should be RS256",
  );

  const decodedClaims = decodeJsonSegment(segments[1]);
  assert.equal(decodedClaims.iss, fakeIssuer, "iss should match fake issuer");
  assert.equal(decodedClaims.iat, nowSeconds - 60, "iat should default to now minus 60 seconds");
  assert.equal(decodedClaims.exp, decodedClaims.iat + 600, "exp should use default 600 second lifetime from iat");
  assert(
    decodedClaims.exp <= nowSeconds + 600,
    "exp should be no more than 10 minutes after now",
  );
  assert.deepEqual(decodedClaims, result.claims, "decoded claims should match result claims");
  assert.equal(result.header.alg, "RS256");
  assert.equal(result.header.typ, "JWT");
  assert.equal(result.public_safe.algorithm, "RS256");
  assert.equal(result.public_safe.jwt_present, true);
  assert.equal(result.public_safe.expires_in_seconds, 600);

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${segments[0]}.${segments[1]}`);
  verifier.end();
  assert.equal(
    verifier.verify(fakePublicKeyPem, Buffer.from(segments[2], "base64url")),
    true,
    "RS256 signature should verify offline with the fake public key",
  );

  assertRejects(
    () =>
      createGitHubAppJwt({
        issuer: fakeIssuer,
        privateKeyPem: fakePrivateKeyPem,
        now: fixedNow,
        expiresInSeconds: 601,
      }),
    "expiresInSeconds > 600 should be rejected",
  );
  assertRejects(
    () =>
      createGitHubAppJwt({
        issuer: fakeIssuer,
        privateKeyPem: fakePrivateKeyPem,
        now: fixedNow,
        expiresInSeconds: 0,
      }),
    "expiresInSeconds <= 0 should be rejected",
  );
  assertRejects(
    () =>
      createGitHubAppJwt({
        issuer: " ",
        privateKeyPem: fakePrivateKeyPem,
        now: fixedNow,
      }),
    "empty issuer should be rejected",
  );
  assertRejects(
    () =>
      createGitHubAppJwt({
        issuer: fakeIssuer,
        privateKeyPem: " ",
        now: fixedNow,
      }),
    "empty private key should be rejected",
  );
  const malformedError = assertRejects(
    () =>
      createGitHubAppJwt({
        issuer: fakeIssuer,
        privateKeyPem: malformedFakeKey,
        now: fixedNow,
      }),
    "malformed fake key should be rejected",
  );
  assert.equal(
    malformedError.message.includes(malformedFakeKey),
    false,
    "malformed key error must not print key material",
  );
  assertRejects(
    () =>
      createGitHubAppJwt({
        issuer: fakeIssuer,
        privateKeyPem: fakePrivateKeyPem,
        now: "not-a-date",
      }),
    "invalid now should be rejected",
  );

  const publicSafe = redactGitHubAppJwtForResponse(result);
  assertPublicSafe(publicSafe, result.jwt, fakePrivateKeyPem);
  assertPublicSafe(result.public_safe, result.jwt, fakePrivateKeyPem);

  const providerSource = readFileSync("lib/github-token-provider.ts", "utf8");
  assert.doesNotMatch(
    providerSource,
    /github-app-jwt|createGitHubAppJwt/,
    "publish token provider should not import/use GitHub App JWT helper",
  );
  const coreGatedSource = readFileSync("lib/core-gated-publish.ts", "utf8");
  assert.doesNotMatch(
    coreGatedSource,
    /github-app-jwt|createGitHubAppJwt/,
    "core-gated publish should not import/use GitHub App JWT helper",
  );

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["smoke:github-app-jwt-fixture"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-github-app-jwt-fixture.mjs",
    "package.json should register smoke:github-app-jwt-fixture",
  );
  for (const dependencyName of ["jose", "jsonwebtoken", "jwt-simple", "node-jose"]) {
    assert.equal(Object.hasOwn(packageJson.dependencies ?? {}, dependencyName), false);
    assert.equal(Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName), false);
  }

  assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");
  assert.equal(existsSync(dbPath), false, "JWT fixture smoke should not create DB");

  const output = JSON.stringify(
    {
      smoke: "github-app-jwt-fixture",
      jwt_segments: segments.length,
      algorithm: decodedHeader.alg,
      typ: decodedHeader.typ,
      claims_present: ["iat", "exp", "iss"].every((claim) =>
        Object.hasOwn(decodedClaims, claim),
      ),
      issuer_matches_fake_input: decodedClaims.iss === fakeIssuer,
      default_iat_skew_seconds: nowSeconds - decodedClaims.iat,
      exp_seconds_after_now: decodedClaims.exp - nowSeconds,
      public_safe_secret_free: true,
      provider_uses_github_app_jwt: false,
      core_gated_publish_uses_github_app_jwt: false,
      new_jwt_dependencies_added: false,
      fetch_calls: fetchCalls,
      db_created: existsSync(dbPath),
    },
    null,
    2,
  );
  assert.equal(output.includes(result.jwt), false, "smoke output must not contain raw JWT");
  assert.equal(
    output.includes(fakePrivateKeyPem),
    false,
    "smoke output must not contain fake private key",
  );
  console.log(output);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function decodeJsonSegment(segment) {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

function assertRejects(fn, message) {
  try {
    fn();
  } catch (error) {
    assert(error instanceof Error, `${message}: expected an Error`);
    return error;
  }

  assert.fail(message);
}

function assertPublicSafe(value, jwt, privateKeyPem) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes(jwt), false, "public_safe must not expose raw JWT");
  assert.equal(
    serialized.includes(privateKeyPem),
    false,
    "public_safe must not expose private key material",
  );
  assert.equal(
    serialized.includes("BEGIN PRIVATE KEY"),
    false,
    "public_safe must not expose private key markers",
  );
}
