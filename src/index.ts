import * as core from "@actions/core";
import * as github from "@actions/github";
import { registerRelease, resolveRelease, RegistryRequestError } from "./lib.js";

async function run() {
  try {
    const token = core.getInput("token") || core.getInput("jolter-token") || undefined;
    const githubToken = core.getInput("github-token") || undefined;

    if (!token && !githubToken) {
      throw new Error(
        "Either 'token' (Jolter registry personal access token) or 'github-token' must be provided.",
      );
    }

    if (token) {
      core.setSecret(token);
    }
    if (githubToken) {
      core.setSecret(githubToken);
    }

    const releasePayload = github.context.payload.release as { tag_name?: string } | undefined;
    const release = resolveRelease({
      inputVersion: core.getInput("version") || undefined,
      inputReleaseTag: core.getInput("release-tag") || undefined,
      eventReleaseTag: releasePayload?.tag_name,
      refName: process.env.GITHUB_REF_NAME,
    });

    core.info(
      "Registering " + core.getInput("plugin-name", { required: true }) + "@" + release.version,
    );

    const result = await registerRelease({
      registryUrl: core.getInput("registry-url", { required: true }),
      pluginName: core.getInput("plugin-name", { required: true }),
      token,
      githubToken,
      ...release,
    });

    core.setOutput("version", release.version);
    core.setOutput("release-tag", release.releaseTag);
    core.setOutput("registered", String(result.registered));

    if (result.registered) {
      core.info("Jolter registry version created.");
    } else {
      core.warning("This version already exists in the Jolter registry.");
    }
  } catch (error) {
    if (error instanceof RegistryRequestError) {
      core.setFailed(error.message + " (HTTP " + error.status + "): " + JSON.stringify(error.body));
      return;
    }

    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

void run();
