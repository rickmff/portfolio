// A Blob store is connected either the classic way (BLOB_READ_WRITE_TOKEN) or through OIDC,
// where Vercel injects BLOB_STORE_ID and the SDK signs requests with the deployment's OIDC token.
export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
