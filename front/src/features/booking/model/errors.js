export class SlotTakenError extends Error {
  constructor(message = 'The selected time slot is no longer available.') {
    super(message)
    this.name = 'SlotTakenError'
    this.code = 'SLOT_TAKEN'
  }
}
