import { PraxisReport } from '../types/report';
import { saveReportToFirestore } from './reportService';

const OFFLINE_QUEUE_KEY = 'tip_kahla_offline_reports_queue';

export interface QueuedReportItem {
  id: string;
  report: PraxisReport;
  studentCode?: string;
  queuedAt: string;
}

export function getOfflineQueue(): QueuedReportItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline queue', e);
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedReportItem[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving offline queue', e);
  }
}

export function enqueueReportOffline(report: PraxisReport, studentCode?: string): QueuedReportItem {
  const queue = getOfflineQueue();
  const item: QueuedReportItem = {
    id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    report,
    studentCode,
    queuedAt: new Date().toISOString(),
  };
  queue.push(item);
  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: queue.length } }));
  return item;
}

export async function processOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;
  const remaining: QueuedReportItem[] = [];

  for (const item of queue) {
    try {
      await saveReportToFirestore(item.report, item.studentCode);
      synced++;
    } catch (err) {
      console.warn('Failed to sync offline report', item, err);
      failed++;
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  window.dispatchEvent(
    new CustomEvent('offline-queue-synced', {
      detail: { synced, remainingCount: remaining.length },
    })
  );

  return { synced, failed };
}
