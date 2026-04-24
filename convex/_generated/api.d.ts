/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as commitActions from "../commitActions.js";
import type * as commits from "../commits.js";
import type * as github from "../github.js";
import type * as ingestion from "../ingestion.js";
import type * as ingestionMutations from "../ingestionMutations.js";
import type * as repos from "../repos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  commitActions: typeof commitActions;
  commits: typeof commits;
  github: typeof github;
  ingestion: typeof ingestion;
  ingestionMutations: typeof ingestionMutations;
  repos: typeof repos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
