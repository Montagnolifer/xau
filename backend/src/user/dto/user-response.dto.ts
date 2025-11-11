export class UserResponseDto {
  id: string;
  name: string;
  whatsapp: string;
  agreeMarketing: boolean;
  isActive: boolean;
  isWholesale: boolean;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  currency?: string;
  language?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
} 