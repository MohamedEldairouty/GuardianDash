export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  enabled: boolean;
}
