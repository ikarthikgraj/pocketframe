import path from "node:path";
import { getConfig } from "@/lib/config";
import { MockVideoProvider } from "./mock-provider";
import { RealVideoProvider } from "./real-provider";
import type { VideoProvider } from "./provider";

const mockProvider = new MockVideoProvider();
export function getVideoProvider(name: "mock" | "real" = "mock"): VideoProvider { return name === "real" ? new RealVideoProvider() : mockProvider; }
export function videoAbsolutePath(relativePath: string): string { return path.join(getConfig().dataDirectory, relativePath); }
export function isSafeMediaPath(relativePath: string): boolean { return !path.posix.isAbsolute(relativePath) && !relativePath.split("/").includes("..") && relativePath.endsWith(".mp4"); }
