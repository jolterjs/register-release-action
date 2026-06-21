import semver from "semver";

export interface ReleaseContext {
  inputVersion?: string;
  inputReleaseTag?: string;
  eventReleaseTag?: string;
  refName?: string;
}

export interface ResolvedRelease {
  version: string;
  releaseTag: string;
}

export interface RegisterReleaseInput extends ResolvedRelease {
  registryUrl: string;
  pluginName: string;
  githubToken: string;
}

export interface RegisterReleaseResult {
  registered: boolean;
  status: number;
  body: unknown;
}

export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class RegistryRequestError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function resolveRelease(context: ReleaseContext): ResolvedRelease {
  const releaseTag =
    context.inputReleaseTag || context.eventReleaseTag || context.refName;

  if (!releaseTag) {
    throw new Error(
      "No release tag found. Run on release.published or provide release-tag.",
    );
  }

  const version = context.inputVersion || releaseTag.replace(/^v/, "");
  if (!semver.valid(version)) {
    throw new Error("Version is not valid semantic versioning: " + version);
  }

  return { version, releaseTag };
}

async function responseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function registerRelease(
  input: RegisterReleaseInput,
  fetcher: Fetcher = fetch,
): Promise<RegisterReleaseResult> {
  const registryUrl = input.registryUrl.replace(/\/$/, "");
  const endpoint =
    registryUrl +
    "/plugins/" +
    encodeURIComponent(input.pluginName) +
    "/versions";

  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "@jolter/register-release-action",
    },
    body: JSON.stringify({
      githubToken: input.githubToken,
      version: input.version,
      releaseTag: input.releaseTag,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await responseBody(response);

  if (response.status === 409) {
    return { registered: false, status: response.status, body };
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Registry returned HTTP " + response.status;
    throw new RegistryRequestError(response.status, message, body);
  }

  return { registered: true, status: response.status, body };
}
