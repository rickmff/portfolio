export function dbConfig(): { url: string; authToken: string | undefined };
export function ensureLocalDir(url: string): Promise<void>;
