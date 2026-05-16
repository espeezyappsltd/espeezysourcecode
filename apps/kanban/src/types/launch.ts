export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface LaunchConfig {
  launch_date: string
  launch_message: string
  preregister_goal: string
  brand_name: string
  preregister_open?: string
  platform_version?: string
}

export type LaunchConfigKey =
  | 'launch_date'
  | 'launch_message'
  | 'preregister_goal'
  | 'preregister_open'
  | 'brand_name'
  | 'platform_version'

export type LaunchConfigMap = Partial<Record<LaunchConfigKey, string>>
