import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { safeState, seedState, serializeAppState } from "../../lib/invoice-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataFilePath = path.join(process.cwd(), "data", "app-state.json");
const dataFileInRepo = process.env.GITHUB_DATA_PATH || "data/app-state.json";

type StorageMode = "file" | "github" | "browser";

export async function GET() {
  const mode = storageMode();

  if (mode === "github") {
    if (!githubConfig()) {
      return NextResponse.json({
        state: seedState,
        storage: storageStatus("browser", false, "GitHub token missing")
      });
    }

    const githubState = await readGithubState();
    if (githubState) {
      return NextResponse.json({
        state: githubState,
        storage: storageStatus("github", true, "GitHub repo data")
      });
    }

    return NextResponse.json({
      state: seedState,
      storage: storageStatus("browser", false, "GitHub read failed")
    });
  }

  if (mode === "file") {
    const fileState = await readFileState();
    return NextResponse.json({
      state: fileState,
      storage: storageStatus("file", true, "Repo data file")
    });
  }

  return NextResponse.json({
    state: seedState,
    storage: storageStatus("browser", false, "Browser fallback")
  });
}

export async function PUT(request: Request) {
  const state = safeState(await request.json());
  const mode = storageMode();

  if (mode === "github") {
    if (!githubConfig()) {
      return NextResponse.json({
        storage: storageStatus("browser", false, "GitHub token missing")
      });
    }

    const saved = await writeGithubState(state);
    if (saved) {
      return NextResponse.json({
        storage: storageStatus("github", true, "Saved to GitHub")
      });
    }

    return NextResponse.json({
      storage: storageStatus("browser", false, "GitHub save failed")
    });
  }

  if (mode === "file") {
    await fs.writeFile(dataFilePath, serializeAppState(state), "utf8");
    return NextResponse.json({
      storage: storageStatus("file", true, "Saved to repo data file")
    });
  }

  return NextResponse.json({
    storage: storageStatus("browser", false, "Saved in this browser")
  });
}

async function readFileState() {
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    return safeState(JSON.parse(data));
  } catch {
    return seedState;
  }
}

function storageMode(): StorageMode {
  const requested = process.env.DATA_STORAGE?.toLowerCase();

  if (requested === "github") return "github";
  if (requested === "file") return "file";
  if (requested === "browser") return "browser";

  return process.env.VERCEL ? "browser" : "file";
}

function storageStatus(mode: StorageMode, persisted: boolean, label: string) {
  return {
    mode,
    persisted,
    label,
    at: new Date().toISOString()
  };
}

function githubConfig() {
  const repository = process.env.GITHUB_REPOSITORY || joinRepo(process.env.GITHUB_OWNER, process.env.GITHUB_REPO);
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!repository || !token) return undefined;

  return {
    repository,
    token,
    branch
  };
}

function joinRepo(owner?: string, repo?: string) {
  if (!owner || !repo) return "";
  return `${owner}/${repo}`;
}

async function readGithubState() {
  const config = githubConfig();
  if (!config) return undefined;

  const response = await fetch(githubContentsUrl(config.repository), {
    headers: githubHeaders(config.token),
    cache: "no-store"
  });

  if (!response.ok) return undefined;

  const payload = (await response.json()) as { content?: string; encoding?: string };
  if (!payload.content || payload.encoding !== "base64") return undefined;

  const json = Buffer.from(payload.content, "base64").toString("utf8");
  return safeState(JSON.parse(json));
}

async function writeGithubState(state: unknown) {
  const config = githubConfig();
  if (!config) return false;

  const current = await fetch(githubContentsUrl(config.repository), {
    headers: githubHeaders(config.token),
    cache: "no-store"
  });
  const currentPayload = current.ok ? ((await current.json()) as { sha?: string }) : {};

  const response = await fetch(githubContentsUrl(config.repository), {
    method: "PUT",
    headers: {
      ...githubHeaders(config.token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update invoice app data",
      content: Buffer.from(serializeAppState(safeState(state))).toString("base64"),
      sha: currentPayload.sha,
      branch: config.branch
    })
  });

  return response.ok;
}

function githubContentsUrl(repository: string) {
  return `https://api.github.com/repos/${repository}/contents/${dataFileInRepo}`;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}
