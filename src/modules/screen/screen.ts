export interface ScreenState {
  roomId: string
  isPlaying: boolean
  currentTime: number
  videoUrl: string
  playbackStartedAt: Date | null
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ScreenSnapshot extends ScreenState {
  serverNow: Date
}

export type ScreenAction =
  | 'set_video'
  | 'play'
  | 'pause'
  | 'seek'
  | 'forward'

export interface ScreenCommandResult {
  action: ScreenAction
  state: ScreenSnapshot
}
