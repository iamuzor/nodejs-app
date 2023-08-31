import { startUnleash } from 'unleash-client';
import { Logger, LoggerInstance } from '../logger';

export type FeatureContext = {
  userId?: string;
  [key: string]: string | number | undefined;
};

export type FeatureFlagConfig = {
  appName: string;
  unleashApiUrl: string;
  unleashApiKey: string;
};

type FeatureFlagName = string;

export class FeatureFlag {
  private static featureFlag: FeatureFlag;

  private constructor(
    private readonly unleashPromisified: Promise<any>,
    private readonly logger: LoggerInstance,
  ) {}

  public static instance(config: FeatureFlagConfig): FeatureFlag {
    if (!this.featureFlag) {
      this.featureFlag = new FeatureFlag(
        startUnleash({
          url: config.unleashApiUrl,
          appName: config.appName,
          customHeaders: {
            Authorization: config.unleashApiKey,
          },
        }),
        Logger.instance(),
      );
    }

    return this.featureFlag;
  }

  async isEnabled(
    name: FeatureFlagName,
    context: FeatureContext = {},
  ): Promise<boolean> {
    try {
      this.logger.info('Checking feature flag', { name, context });

      const unleash = await this.unleashPromisified;

      return unleash.isEnabled(name, context);
    } catch (e) {
      this.logger.error('Error checking feature flag');
    }
  }
}
