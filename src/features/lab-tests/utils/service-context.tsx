'use client'

import { createContext, useContext } from 'react'
import type { TestService } from '../services/lab-tests.api'

/**
 * The active test service (`lab` | `radiology` | `opd`) for the current page.
 * Provided by `LabTestsPage` so deeply-nested form controls (e.g. the reflex-test
 * picker) hit the correct SITE_ADMIN endpoint without prop-drilling. Defaults to
 * `'lab'` to preserve the original single-service behaviour.
 */
const TestServiceContext = createContext<TestService>('lab')

export const TestServiceProvider = TestServiceContext.Provider

/** Read the active test service from context. */
export function useTestService(): TestService {
  return useContext(TestServiceContext)
}
