export const REDUCER_MAX_SPEED = 50;

export const initialGameState = {
  speed: 0,
  gasPedalDown: false,
  brakePedalDown: false
};

export function gameReducer(state, action) {
  switch (action.type) {
    case "GAS_PEDAL_DOWN":
      return { ...state, gasPedalDown: true };
    case "GAS_PEDAL_UP":
      return { ...state, gasPedalDown: false };
    case "BRAKE_PEDAL_DOWN":
      return { ...state, brakePedalDown: true };
    case "BRAKE_PEDAL_UP":
      return { ...state, brakePedalDown: false };
    case "INCREASE_SPEED":
      return { ...state, speed: Math.min(REDUCER_MAX_SPEED, state.speed + (action.amount ?? 1)) };
    case "DECREASE_SPEED":
      return { ...state, speed: Math.max(0, state.speed - (action.amount ?? 1)) };
    default:
      return state;
  }
}
