export type LaunchConfigKey =
  | 'launch_date'
  | 'launch_message'
  | 'preregister_goal'
  | 'preregister_open'
  | 'brand_name'
  | 'platform_version'

export type LaunchConfigMap = Partial<Record<LaunchConfigKey, string>>
