import { DB } from "../packages/orm";

export const db = new DB("sqlite://myapp.db");
