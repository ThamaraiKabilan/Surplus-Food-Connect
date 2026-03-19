export const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");
const API_BASE_URL = `${API_ORIGIN}/api`;

const getHeaders = (token, body) => {
  const headers = {};

  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiRequest = async (path, options = {}, token) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(token, options.body),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const buildAssetUrl = (path = "") => {
  if (!path) {
    return "";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
};
