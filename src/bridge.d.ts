// src/bridge.d.ts
import { ProtocolWithReturn } from "webext-bridge";

declare module "webext-bridge" {
  export interface ProtocolMap {
    GET_PAGE_TEXT: ProtocolWithReturn<void, { text: string }>;
  }
}
