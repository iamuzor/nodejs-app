import { Analytics as AnalyticsNode } from '@segment/analytics-node';

export type AnalyticsConfig = {
  segmentWriteKey: string;
};

export class Analytics {
  private static _instance: Analytics;

  private constructor(readonly segment: AnalyticsNode) {}

  static instance(config: AnalyticsConfig): Analytics {
    if (!this._instance) {
      this._instance = new Analytics(
        new AnalyticsNode({
          writeKey: config.segmentWriteKey,
        }),
      );
    }
    return this._instance;
  }
}
