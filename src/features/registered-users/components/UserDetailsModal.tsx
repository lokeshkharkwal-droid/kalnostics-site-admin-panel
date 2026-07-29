'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Modal, Badge, Spinner } from '@/shared/ui'
import { getRegisteredUser } from '../services/registered-users.api'
import type { IUserDetailsModalProps } from '../interfaces'

/** A read-only label/value row. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-notion-faint">{label}</span>
      <span className="text-sm text-notion-text">{value || '—'}</span>
    </div>
  )
}

export function UserDetailsModal({ userId, onClose }: IUserDetailsModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['siteadmin', 'registered-users', userId],
    queryFn: () => getRegisteredUser(userId),
  })

  const footer = (
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  )

  return (
    <Modal title="User Details" onClose={onClose} footer={footer} size="xl">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <p className="py-12 text-center text-sm text-notion-faint">
          Failed to load user details
        </p>
      ) : (
        <div className="space-y-6">
          {/* Identity */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-notion-text">
                {[data.person.salutation, data.person.firstName, data.person.lastName]
                  .filter(Boolean)
                  .join(' ')}
              </h3>
              <Badge variant="default">
                {data.userType === 'STAFF' ? 'Staff' : 'Patient'}
              </Badge>
              {data.status === 'ACTIVE' ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="default">Inactive</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Username" value={data.username} />
              <Field label="Email" value={data.person.email ?? data.loginEmail} />
              <Field label="Phone" value={data.person.phone ?? data.loginPhone} />
              <Field label="Platform MRN" value={data.person.platformMrn} />
              <Field label="Date of Birth" value={data.person.dateOfBirth?.slice(0, 10)} />
              <Field label="Gender" value={data.person.gender} />
              <Field label="Blood Group" value={data.person.bloodGroup} />
              <Field label="Nationality" value={data.person.nationality} />
              <Field label="Father's Name" value={data.person.fatherName} />
              <Field label="Mother's Name" value={data.person.motherName} />
              <Field label="Aadhaar" value={data.person.aadhaarMasked} />
              <Field label="PAN" value={data.person.panNumber} />
              <Field
                label="Emergency Contact"
                value={
                  data.person.emergencyContactName || data.person.emergencyContactNumber
                    ? `${data.person.emergencyContactName ?? ''} ${
                        data.person.emergencyContactNumber ?? ''
                      }`.trim()
                    : null
                }
              />
            </div>
          </section>

          {/* Business memberships & roles */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-notion-text">
              Business Memberships & Roles
            </h3>
            {data.memberships.length === 0 ? (
              <p className="text-sm text-notion-faint">
                No business memberships (this person has no staff role).
              </p>
            ) : (
              <div className="space-y-3">
                {data.memberships.map(m => (
                  <div
                    key={m.tenantId}
                    className="rounded-lg border border-notion-line p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-notion-text">
                        {m.tenantName}
                      </span>
                      <span className="text-xs text-notion-faint">{m.userCode}</span>
                      <Badge variant="default">{m.userType}</Badge>
                      {m.status === 'ACTIVE' ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                      {m.roleLabel && (
                        <span className="ml-auto text-xs text-notion-sub">
                          {m.roleLabel}
                        </span>
                      )}
                    </div>
                    {m.branches.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {m.branches.map((b, i) => (
                          <li
                            key={b.branchId ?? `tenant-level-${i}`}
                            className="flex flex-wrap items-center gap-2 text-xs text-notion-sub"
                          >
                            {/* Branch name */}
                            <span className="font-medium text-notion-text">
                              {b.branchName ?? 'Tenant-level'}
                            </span>
                            {/* Role */}
                            <span className="text-notion-faint">·</span>
                            <span>{b.roleLabel || '—'}</span>
                            {b.moduleLabel && (
                              <>
                                <span className="text-notion-faint">·</span>
                                <span>{b.moduleLabel}</span>
                              </>
                            )}
                            {/* Default branch + active status (always shown) */}
                            <span className="ml-auto flex items-center gap-1.5">
                              {b.isDefault && <Badge variant="primary">Default</Badge>}
                              {b.branchStatus === 'ACTIVE' ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="danger">Inactive</Badge>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
