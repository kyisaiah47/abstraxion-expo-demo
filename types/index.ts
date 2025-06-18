import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type ExecuteResultOrUndefined = ExecuteResult | undefined;

export type QueryResult = {
  users?: string[];
  value?: string;
  map?: Array<[string, string]>;
};
