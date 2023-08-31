import axios, { AxiosInstance } from 'axios';
import { Logger, LoggerInstance } from '../logger';

export type Neo4jQueryStatement = {
  statement: string;
  parameters: { [key: string]: any };
};

export enum Neo4jAccessMode {
  READ = 'READ',
  WRITE = 'WRITE',
}

export type Neo4jConfig = {
  accessMode: Neo4jAccessMode;
  baseUrl: string;
  username: string;
  password: string;
  logger?: LoggerInstance;
};

export class Neo4j {
  private readonly http: AxiosInstance;
  private readonly logger: LoggerInstance;

  constructor(readonly config: Neo4jConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
        'Access-Mode': config.accessMode,
      },
      auth: {
        username: config.username,
        password: config.password,
      },
    });

    this.logger = config.logger ?? Logger.instance();
  }

  async post(statements: Neo4jQueryStatement[]): Promise<any> {
    try {
      this.logger.info('Executing Neo4j query', { query: { statements } });

      const response = await this.http.post('/', { statements });

      return response;
    } catch (e) {
      this.logger.error('Error executing Neo4j query', { error: e });

      throw e;
    }
  }
}
