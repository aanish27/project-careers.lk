/**
 * Encode any string id into an opaque base64 cursor token.
 *
 * @example
 * const token = encodeCursor('user-123');
 * // "eyJpZCI6InVzZXItMTIzIn0="
 */
export function encodeCursor(id: string): string {
  return Buffer.from(JSON.stringify({ id })).toString('base64');
}

/**
 * Decode an opaque base64 cursor token back to the original id.
 *
 * @example
 * const id = decodeCursor('eyJpZCI6InVzZXItMTIzIn0=');
 * // "user-123"
 */
export function decodeCursor(cursor: string): string {
  const { id } = JSON.parse(
    Buffer.from(cursor, 'base64').toString('utf-8'),
  ) as { id: string };
  return id;
}
