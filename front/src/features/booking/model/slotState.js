export const SLOT_STATES = {
  FREE: 'free',
  TAKEN: 'taken',
  BLOCKED: 'blocked',
  PAST: 'past',
}

export const isSlotSelectable = (state) => state === SLOT_STATES.FREE
