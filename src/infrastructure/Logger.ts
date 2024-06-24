export type LogLevel = {
  level?: 'info' | 'error' | 'debug'
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  error: 2,
}

export class Logger {
  private readonly level: number

  constructor(options: LogLevel = {}) {
    this.level = this.toLogLevel(options.level)
  }

  public info(namespace: string, name: string, data: Record<any, any>) {
    if (LOG_LEVELS.info >= this.level) {
      console.info(this.formatPrefix(namespace, name), this.serialize(data))
    }
  }

  public error(namespace: string, name: string, data: Record<any, any>) {
    if (LOG_LEVELS.error >= this.level) {
      console.error(this.formatPrefix(namespace, name), this.serialize(data))
    }
  }

  public debug(namespace: string, name: string, data: Record<any, any>) {
    if (LOG_LEVELS.debug >= this.level) {
      console.debug(this.formatPrefix(namespace, name), this.serialize(data))
    }
  }

  private toLogLevel(level?: 'info' | 'error' | 'debug'): number {
    if (level === 'info') {
      return LOG_LEVELS.info
    }
    if (level === 'error') {
      return LOG_LEVELS.error
    }
    if (level === 'debug') {
      return LOG_LEVELS.debug
    }
    return 100
  }

  private formatPrefix(namespace: string, name: string) {
    return `[${namespace}][${name}]`
  }

  private serialize(data: Record<any, any>) {
    return JSON.stringify(data)
  }
}
