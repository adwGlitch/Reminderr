export type Priority = "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type ReminderStatus = "pending" | "completed";
export type GroupRole = "owner" | "admin" | "member";

export interface UserStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  joinedDate: string; // ISO date string or formatted date
  stats?: UserStats;
  disabled?: boolean;
  superAdmin?: boolean;
}

export interface Reminder {
  id?: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:mm format
  priority: Priority;
  status: ReminderStatus;
  recurrence: Recurrence;
  ownerId: string; // Creator user id
  groupId: string | null; // Null if personal reminder
  assignedTo: string | null; // User id if assigned
  visibilityRestriction: boolean; // True if only visible to assignee + admins
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  completedAt: string | null; // ISO timestamp or null
}

export interface Group {
  id?: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id?: string; // groupId_userId
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  userProfile?: UserProfile; // Joined profile details for display
}

export interface NotificationType {
  id?: string;
  userId: string;
  type: "due" | "upcoming" | "assigned" | "invite" | "activity";
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface GroupInvitation {
  id?: string;
  groupId: string;
  groupName: string;
  email: string;
  invitedBy: string; // User ID
  invitedByName: string; // User display name
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface ActivityLog {
  id?: string;
  groupId: string | null;
  userId: string;
  userName: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}
