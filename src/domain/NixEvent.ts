export type NixEventId = string
export type NixEventType = string

export type NixNewEvent = {
  id?: NixEventId
  type: NixEventType
  payload: Record<string, any>
  created_at?: Date
  updated_at?: Date
}

export type NixEvent = {
  id: NixEventId
  type: NixEventType
  payload: Record<string, any>
  created_at: Date
  updated_at: Date
}
