import { buildMockAssetUrl, mockApiRequest } from "./mockApi.js";

export const API_ORIGIN = "mock://local";

export const apiRequest = (path, options = {}, token) =>
  mockApiRequest(path, options, token);

export const buildAssetUrl = (path = "") => buildMockAssetUrl(path);
