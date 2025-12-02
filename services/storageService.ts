import { openDB, DBSchema } from 'idb';
import { VideoFrame } from '../types';

interface FramePerfectDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      frames: VideoFrame[];
      updatedAt: number;
    };
  };
}

const DB_NAME = 'frameperfect-db';
const STORE_NAME = 'projects';
const PROJECT_KEY = 'current_project';

const dbPromise = openDB<FramePerfectDB>(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  },
});

export const saveProject = async (frames: VideoFrame[]) => {
  const db = await dbPromise;
  await db.put(STORE_NAME, {
    id: PROJECT_KEY,
    frames,
    updatedAt: Date.now(),
  });
};

export const loadProject = async (): Promise<VideoFrame[]> => {
  const db = await dbPromise;
  const project = await db.get(STORE_NAME, PROJECT_KEY);
  return project ? project.frames : [];
};

export const clearProject = async () => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, PROJECT_KEY);
};