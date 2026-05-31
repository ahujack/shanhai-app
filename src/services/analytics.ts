import { analyticsApi, apiDebugLog, type AnalyticsTrackEvent } from './api';

function getClientContext(): { locale?: string; timezone?: string } {
  let timezone: string | undefined;
  let locale: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    /* ignore */
  }
  try {
    if (typeof navigator !== 'undefined') {
      locale = navigator.language;
    }
  } catch {
    /* ignore */
  }
  return { timezone, locale };
}

/** 批量上报埋点（失败静默，不打断业务流程） */
export async function trackEvents(events: AnalyticsTrackEvent[]): Promise<void> {
  if (!events.length) return;
  try {
    await analyticsApi.track({
      events,
      client: getClientContext(),
    });
  } catch (e) {
    apiDebugLog('[analytics] track failed', e);
  }
}

export function trackScreenView(path: string): void {
  void trackEvents([{ name: 'screen_view', props: { path } }]);
}

export function trackNamedEvent(name: string, props?: Record<string, unknown>): void {
  void trackEvents([{ name, props }]);
}

export function trackFeature(name: string, props?: Record<string, unknown>): void {
  void trackEvents([{ name: 'feature_use', props: { feature: name, ...props } }]);
}
