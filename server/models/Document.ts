export interface DocumentListItem {
  id: string;
  title: string | null;
  updated_at: string;
  created_at: string;
}

export interface DocumentSchema {
  id: string;
  ownerUserId: string;
  title: string | null;
  data: any;
  createdAt: string;
  updatedAt: string;
}