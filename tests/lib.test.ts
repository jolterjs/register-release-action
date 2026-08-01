import { describe, expect, test } from "bun:test";
import { registerRelease, resolveRelease, RegistryRequestError } from "../src/lib";

describe("release resolution", () => {
  test("uses the release event and strips a leading v", () => {
    expect(resolveRelease({ eventReleaseTag: "v1.4.0" })).toEqual({
      version: "1.4.0",
      releaseTag: "v1.4.0",
    });
  });

  test("rejects invalid semantic versions", () => {
    expect(() => resolveRelease({ eventReleaseTag: "nightly" })).toThrow();
  });

  test("explicit inputs take precedence", () => {
    expect(
      resolveRelease({
        inputVersion: "2.0.0-beta.1",
        inputReleaseTag: "release-2-beta",
        eventReleaseTag: "v1.0.0",
      }),
    ).toEqual({
      version: "2.0.0-beta.1",
      releaseTag: "release-2-beta",
    });
  });
});

describe("registry request", () => {
  test("encodes scoped plugin names and posts release metadata", async () => {
    let requestUrl = "";
    let requestBody = "";
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      requestUrl = String(url);
      requestBody = String(init?.body);
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    };

    const result = await registerRelease(
      {
        registryUrl: "https://registry.example/",
        pluginName: "@jolter/example",
        githubToken: "secret",
        version: "1.2.3",
        releaseTag: "v1.2.3",
      },
      fetcher,
    );

    expect(requestUrl).toBe("https://registry.example/plugins/%40jolter%2Fexample/versions");
    expect(JSON.parse(requestBody)).toEqual({
      githubToken: "secret",
      version: "1.2.3",
      releaseTag: "v1.2.3",
    });
    expect(result.registered).toBe(true);
  });

  test("supports Jolter registry personal token with Bearer authorization header", async () => {
    let requestUrl = "";
    let requestHeaders: HeadersInit | undefined;
    let requestBody = "";
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      requestUrl = String(url);
      requestHeaders = init?.headers;
      requestBody = String(init?.body);
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    };

    const result = await registerRelease(
      {
        registryUrl: "https://registry.example/",
        pluginName: "@jolter/example",
        token: "jolter_pat_12345",
        version: "1.2.3",
        releaseTag: "v1.2.3",
      },
      fetcher,
    );

    expect(requestUrl).toBe("https://registry.example/plugins/%40jolter%2Fexample/versions");
    expect((requestHeaders as Record<string, string>)["Authorization"]).toBe(
      "Bearer jolter_pat_12345",
    );
    expect(JSON.parse(requestBody)).toEqual({
      version: "1.2.3",
      releaseTag: "v1.2.3",
    });
    expect(result.registered).toBe(true);
  });

  test("supports sending both token and githubToken when provided", async () => {
    let requestHeaders: HeadersInit | undefined;
    let requestBody = "";
    const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
      requestHeaders = init?.headers;
      requestBody = String(init?.body);
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    };

    await registerRelease(
      {
        registryUrl: "https://registry.example/",
        pluginName: "example",
        token: "jolter_pat_12345",
        githubToken: "gh_secret",
        version: "1.2.3",
        releaseTag: "v1.2.3",
      },
      fetcher,
    );

    expect((requestHeaders as Record<string, string>)["Authorization"]).toBe(
      "Bearer jolter_pat_12345",
    );
    expect(JSON.parse(requestBody)).toEqual({
      githubToken: "gh_secret",
      version: "1.2.3",
      releaseTag: "v1.2.3",
    });
  });

  test("supports sending idToken for OIDC authentication", async () => {
    let requestBody = "";
    const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
      requestBody = String(init?.body);
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    };

    const result = await registerRelease(
      {
        registryUrl: "https://registry.example/",
        pluginName: "example",
        idToken: "oidc_jwt_token",
        version: "1.2.3",
        releaseTag: "v1.2.3",
      },
      fetcher,
    );

    expect(JSON.parse(requestBody)).toEqual({
      idToken: "oidc_jwt_token",
      version: "1.2.3",
      releaseTag: "v1.2.3",
    });
    expect(result.registered).toBe(true);
  });

  test("throws if neither token, githubToken, nor idToken is provided", async () => {
    await expect(
      registerRelease({
        registryUrl: "https://registry.example",
        pluginName: "example",
        version: "1.2.3",
        releaseTag: "v1.2.3",
      }),
    ).rejects.toThrow("Either 'token', 'githubToken', or 'idToken' must be provided");
  });

  test("treats an existing version as an idempotent result", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ error: "Version already exists" }), {
        status: 409,
      });

    const result = await registerRelease(
      {
        registryUrl: "https://registry.example",
        pluginName: "example",
        githubToken: "secret",
        version: "1.2.3",
        releaseTag: "v1.2.3",
      },
      fetcher,
    );

    expect(result.registered).toBe(false);
  });

  test("throws useful registry failures", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ error: "Repository verification failed" }), {
        status: 400,
      });

    await expect(
      registerRelease(
        {
          registryUrl: "https://registry.example",
          pluginName: "example",
          githubToken: "secret",
          version: "1.2.3",
          releaseTag: "v1.2.3",
        },
        fetcher,
      ),
    ).rejects.toBeInstanceOf(RegistryRequestError);
  });
});
