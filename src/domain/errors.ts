class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = message
  }
}

export class EventIdIsRequired extends DomainError {
  constructor() {
    super('EventIdIsRequired')
  }
}
