/**
 * Encode a numeric id into an opaque base64 cursor token.
 *
 * @example
 * const token = encodeCursor(123);
 * // "eyJpZCI6MTIzfQ=="
 */
export function encodeCursor(id: number): string {
  return Buffer.from(JSON.stringify({ id })).toString('base64');
}

/**
 * Decode an opaque base64 cursor token back to the original id.
 *
 * @example
 * const id = decodeCursor('eyJpZCI6MTIzfQ==');
 * // 123
 */
export function decodeCursor(cursor: string): number {
  const { id } = JSON.parse(
    Buffer.from(cursor, 'base64').toString('utf-8'),
  ) as { id: number };
  return id;
}
