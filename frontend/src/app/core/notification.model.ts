export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'evaluation_assigned'
  | 'evaluation_validated'
  | 'career_updated'
  | 'wish_status_changed'
  | 'sync_completed'
  | 'license_expiring'
  | string;

export interface NotificationPage {
  items: Notification[];
  totalCount: number;
}
