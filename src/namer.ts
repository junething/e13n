import { NamedString, StringContext } from "./main";

export type Namer = <K,>(strs: Map<K, StringContext>) => Promise<Map<K, NamedString>>;