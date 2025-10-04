import { db, notes, mentions } from './index';
import { generateId } from '../utils/id-generator';

// NOTE: Seed script for test data
async function seed() {
  console.log('Seeding database...');

  // Create root note
  const rootId = generateId();
  await db.insert(notes).values({
    id: rootId,
    content: 'Welcome to Thread Notes! This is your first note.',
    depth: 0,
  });

  // Create reply
  const replyId = generateId();
  await db.insert(notes).values({
    id: replyId,
    content: `This is a reply to @${rootId}`,
    parentId: rootId,
    depth: 1,
  });

  // Create mention
  await db.insert(mentions).values({
    id: generateId(),
    fromNoteId: replyId,
    toNoteId: rootId,
    position: 17,
  });

  console.log('✓ Database seeded with sample data');
}

seed().catch(console.error);
