import axios from "axios";
import { getApexToken } from "./auth";
import {
  ApexSessionExpiredError,
  graphqlErrorsIndicateApexSessionExpiry,
  isApexSessionExpiredError,
  scheduleApexSessionExpiredRedirect,
} from "./sessionExpiry";

function normalizeGraphqlHttpUrl(raw: string | undefined): string {
  const fallback = "https://hotcol-admin-backend.vercel.app/graphql";
  const s = (raw ?? fallback).trim() || fallback;
  const base = s.replace(/\/+$/, "");
  if (/\/graphql$/i.test(base)) return base;
  return `${base}/graphql`;
}

const API_URL = normalizeGraphqlHttpUrl(process.env.NEXT_PUBLIC_APEX_API_URL);

function resolveGraphqlTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_APEX_GRAPHQL_TIMEOUT_MS;
  const n = raw ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (Number.isFinite(n) && n >= 10_000 && n <= 300_000) return n;
  return 60_000;
}

export const APEX_GRAPHQL_TIMEOUT_MS = resolveGraphqlTimeoutMs();

const apexApi = axios.create({
  timeout: APEX_GRAPHQL_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

apexApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getApexToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apexApi.interceptors.response.use(
  (response) => {
    const errs = response.data?.errors as Array<{ message?: string }> | undefined;
    if (graphqlErrorsIndicateApexSessionExpiry(errs)) {
      scheduleApexSessionExpiredRedirect();
      return Promise.reject(new ApexSessionExpiredError());
    }
    return response;
  },
  (error) => {
    if (isApexSessionExpiredError(error)) return Promise.reject(error);
    if (error.response?.status === 401 && typeof window !== "undefined") {
      scheduleApexSessionExpiredRedirect();
      return Promise.reject(new ApexSessionExpiredError());
    }
    return Promise.reject(error);
  },
);

export async function apexGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await apexApi.post(API_URL, { query, variables });

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0]?.message || "GraphQL error");
  }
  return response.data.data as T;
}

export function mapApexApiError(error: unknown, fallback = "Request failed"): string {
  if (isApexSessionExpiredError(error)) return "";
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return `Request timed out (>${APEX_GRAPHQL_TIMEOUT_MS / 1000}s). Check your connection and try again.`;
    }
    if (!error.response) {
      return "Cannot reach the Apex API. Is the GraphQL server running?";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
