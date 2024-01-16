import { vi } from 'vitest';
import { config } from 'dotenv';

vi.stubGlobal('crypto', crypto);
vi.stubGlobal('requestIdleCallback', (callback: any) => setTimeout(callback, 50));
config();
