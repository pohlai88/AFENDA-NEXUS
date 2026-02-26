# Document Naming Convention (Upload & Download)

**Enterprise-grade spec: safe across browsers, stable for audits, not annoying
for users.**

## Upload

- **Client sends** `fileName` in init body or multipart form.
- **Server sanitizes** before storing:
  - Normalize: Unicode **NFC** (prevents NFC vs NFD spoofing from macOS).
  - Remove: `/`, `\`, `\0`, ASCII control chars (`\u0000`–`\u001F`, `\u007F`),
    CR/LF, bidi controls.
  - Trim: leading/trailing whitespace; trailing dot and space (Windows strips
    them).
  - Collapse: repeated whitespace runs.
  - Max length: 255 chars (truncate preserving extension).
  - Reserved names: rewrite `CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`,
    `LPT1`–`LPT9` (case-insensitive).
  - Fallback: `"document"` if empty after sanitization.
- **Persist:**
  - `file_name_original` (optional, capped) — raw from client for audit.
  - `file_name` (sanitized) — what we use for storage key and display.

## Download

- **Always** `Content-Disposition: attachment` (never `inline` for user
  uploads).
- **RFC 5987** for UTF-8:
  - `attachment; filename="ascii_fallback.ext"; filename*=UTF-8''<pct-encoded>`
- **Re-sanitize** for header context:
  - Escape `"` as `\"`
  - Strip `\r`, `\n` (header injection)
  - Strip `;` (conservative)
- **Max header length:** truncate safely if `filename*` would exceed proxy
  limits.

## Key Layout (Server-Only)

- Storage key: `v{key_version}/{tenant_id}/{document_id}{ext}`
- `ext` derived from **declared MIME** at init/upload time (via `extFromMime`).
  - Not from user filename; not from observed MIME (observed is for audit only).
- If MIME cannot be confidently mapped: use `.bin`.
- Client never supplies the key; server builds it from metadata.

## Optional: Tenant Privacy in Key

- `v{key_version}/t/{tenant_hash}/{document_id}{ext}`
- `tenant_hash = base32(sha256(tenant_id + server_salt))[:16]`
- Reduces accidental tenant ID exposure in logs/analytics.

## Shared Helpers

All routes and adapters use the same logic:

- `sanitizeFilenameForStorage(name): { original, safe, asciiFallback }`
- `buildContentDisposition(safeName): string`
- `extFromMime(mime: string): string`
