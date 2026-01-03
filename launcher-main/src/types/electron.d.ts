export interface MinecraftLaunchOptions {
  username: string
  javaPath?: string
}

export interface MinecraftProgress {
  stage: string
  progress: number
  current?: string
}

export interface MinecraftLaunchResult {
  success: boolean
  error?: string
  process?: any
}

export { }
