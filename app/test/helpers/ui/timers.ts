import { mock } from 'node:test'

type TimerApi = 'Date' | 'setTimeout'

export function enableTestTimers(apis: ReadonlyArray<TimerApi>, now?: number) {
  mock.timers.enable({ apis: [...apis] })

  if (now !== undefined) {
    mock.timers.setTime(now)
  }
}

export function advanceTimersBy(ms: number) {
  mock.timers.tick(ms)
}

export function resetTestTimers() {
  mock.timers.reset()
}
