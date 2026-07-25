import { PrismaClient } from '@careerslk/database';
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_DESCRIPTIONS,
  parsePermissionKey,
  type PermissionKey,
} from '@careerslk/types';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Syncing permissions...');

  const existing = await prisma.permission.findMany({
    select: { id: true, key: true, description: true },
  });
  const existingByKey = new Map(existing.map((p) => [p.key, p]));

  const toInsert: {
    key: string;
    module: string;
    action: string;
    description: string;
  }[] = [];
  const toUpdate: { id: number; description: string }[] = [];
  let unchanged = 0;

  for (const key of ALL_PERMISSION_KEYS) {
    const description = PERMISSION_DESCRIPTIONS[key];
    const current = existingByKey.get(key);

    if (!current) {
      const { module, action } = parsePermissionKey(key);
      toInsert.push({ key, module, action, description });
    } else if (current.description !== description) {
      toUpdate.push({ id: current.id, description });
    } else {
      unchanged++;
    }
  }

  const registryKeys = new Set<string>(ALL_PERMISSION_KEYS as PermissionKey[]);
  const orphaned = existing
    .map((p) => p.key)
    .filter((key) => !registryKeys.has(key));

  await prisma.$transaction(async (tx) => {
    if (toInsert.length > 0) {
      await tx.permission.createMany({ data: toInsert });
    }

    for (const { id, description } of toUpdate) {
      await tx.permission.update({ where: { id }, data: { description } });
    }
  });

  console.log(
    `  Permissions: ${toInsert.length} inserted, ${toUpdate.length} updated, ${unchanged} unchanged` +
      (orphaned.length > 0
        ? `, ${orphaned.length} orphaned (${orphaned.join(', ')})`
        : ''),
  );
}
