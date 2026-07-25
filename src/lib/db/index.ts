import { getDatabase } from "./connection";
import { createRepositories } from "./repositories";

export const repositories = () => createRepositories(getDatabase());
