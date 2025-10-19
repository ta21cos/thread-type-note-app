import { execSync } from 'child_process';
import path from 'path';

// NOTE: Helper to clean test database by running backend script
export async function cleanDatabase() {
  const backendDir = path.resolve(process.cwd(), '../backend');
  const scriptPath = path.join(backendDir, 'src/db/clean-test-db.ts');

  execSync(`bun run ${scriptPath}`, {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });
}
