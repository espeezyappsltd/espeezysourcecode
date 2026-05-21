'use client'

import { useEffect, useState } from 'react'
import { useKanbanAppLink } from './useKanbanAppLink'

/** SSO URL to kanban.espeezy.com workspace for the signed-in user. */
export function useKanbanWorkspaceLink(): string {
  return useKanbanAppLink('/')
}
