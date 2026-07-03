/** Person kind on the Registered Users surface. */
export type RegisteredUserType = 'STAFF' | 'PATIENT'

/** A row in the Registered Users list (`/siteadmin/registered-users`). */
export interface RegisteredUser {
  id: string
  name: string
  username: string | null
  email: string | null
  userType: RegisteredUserType
  status: 'ACTIVE' | 'INACTIVE'
}

/** One branch assignment on a business membership (detail view). */
export interface RegisteredUserMembershipBranch {
  branchId: string | null
  branchName: string | null
  roleKey: string
  roleLabel: string
  branchStatus: 'ACTIVE' | 'INACTIVE'
  isDefault: boolean
  moduleLabel: string | null
}

/** A person's staff membership at one business (detail view). */
export interface RegisteredUserMembership {
  tenantId: string
  tenantName: string
  userCode: string
  userType: string
  status: 'ACTIVE' | 'INACTIVE'
  roleKey: string | null
  roleLabel: string | null
  branches: RegisteredUserMembershipBranch[]
}

/** Full read-only detail for one registered person. */
export interface RegisteredUserDetail {
  person: {
    id: string
    platformMrn: string
    salutation: string | null
    firstName: string
    lastName: string | null
    dateOfBirth: string | null
    gender: string | null
    bloodGroup: string | null
    phone: string | null
    email: string | null
    nationality: string | null
    fatherName: string | null
    motherName: string | null
    aadhaarMasked: string | null
    panNumber: string | null
    emergencyContactName: string | null
    emergencyContactNumber: string | null
    photoUrl: string | null
    isPatient: boolean
    isStaff: boolean
    isActive: boolean
    createdAt: string
  }
  username: string | null
  loginPhone: string | null
  loginEmail: string | null
  userType: RegisteredUserType
  status: 'ACTIVE' | 'INACTIVE'
  memberships: RegisteredUserMembership[]
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface IRegisteredUserListParams {
  page: number
  limit: number
  search?: string
  status?: 'active' | 'inactive' | ''
}

export interface IRegisteredUserListResult {
  rows: RegisteredUser[]
  total: number
  totalPages: number
}

// ── Component props ───────────────────────────────────────────────────────────

export interface IRegisteredUsersTableProps {
  users: RegisteredUser[]
  onView: (user: RegisteredUser) => void
}

export interface IUserDetailsModalProps {
  /** The person id to load full detail for. */
  userId: string
  onClose: () => void
}
