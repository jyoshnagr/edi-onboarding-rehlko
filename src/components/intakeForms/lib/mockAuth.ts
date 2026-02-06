import { UserProfile } from '../types';

export interface MockUser {
  email: string;
  password: string;
  profile: UserProfile;
}

export const mockUsers: MockUser[] = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    profile: {
      id: '1',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, San Francisco, CA 94102',
      date_of_birth: '1990-05-15',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+1 (555) 987-6543',
      company_name: 'Tech Innovations Inc.',
      country: 'United States',
      job_title: 'Senior Software Engineer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    email: 'sarah.johnson@example.com',
    password: 'password123',
    profile: {
      id: '2',
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Avenue, Los Angeles, CA 90001',
      date_of_birth: '1988-09-22',
      emergency_contact_name: 'Michael Johnson',
      emergency_contact_phone: '+1 (555) 876-5432',
      company_name: 'Global Marketing Solutions LLC',
      country: 'United States',
      job_title: 'Marketing Director',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    email: 'michael.chen@example.com',
    password: 'password123',
    profile: {
      id: '3',
      full_name: 'Michael Chen',
      email: 'michael.chen@example.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine Road, New York, NY 10001',
      date_of_birth: '1992-03-10',
      emergency_contact_name: 'Lisa Chen',
      emergency_contact_phone: '+1 (555) 765-4321',
      company_name: 'Financial Analytics Corp',
      country: 'United States',
      job_title: 'Data Analyst',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    email: 'emily.rodriguez@example.com',
    password: 'password123',
    profile: {
      id: '4',
      full_name: 'Emily Rodriguez',
      email: 'emily.rodriguez@example.com',
      phone: '+1 (555) 456-7890',
      address: '321 Elm Street, Austin, TX 78701',
      date_of_birth: '1995-07-28',
      emergency_contact_name: 'Carlos Rodriguez',
      emergency_contact_phone: '+1 (555) 654-3210',
      company_name: 'Creative Design Studio Ltd',
      country: 'United States',
      job_title: 'UX Designer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    email: 'david.kim@example.com',
    password: 'password123',
    profile: {
      id: '5',
      full_name: 'David Kim',
      email: 'david.kim@example.com',
      phone: '+1 (555) 567-8901',
      address: '654 Maple Drive, Seattle, WA 98101',
      date_of_birth: '1991-11-05',
      emergency_contact_name: 'Susan Kim',
      emergency_contact_phone: '+1 (555) 543-2109',
      company_name: 'Cloud Services International',
      country: 'United States',
      job_title: 'DevOps Engineer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export const mockAuthLogin = (email: string, password: string): UserProfile | null => {
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );
  return user ? user.profile : null;
};

export const mockAuthSignup = (email: string, password: string, profileData?: Partial<UserProfile>): UserProfile => {
  const newProfile: UserProfile = {
    id: (mockUsers.length + 1).toString(),
    full_name: profileData?.full_name || null,
    email: email,
    phone: profileData?.phone || null,
    address: profileData?.address || null,
    date_of_birth: profileData?.date_of_birth || null,
    emergency_contact_name: profileData?.emergency_contact_name || null,
    emergency_contact_phone: profileData?.emergency_contact_phone || null,
    company_name: profileData?.company_name || null,
    country: profileData?.country || null,
    job_title: profileData?.job_title || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockUsers.push({
    email,
    password,
    profile: newProfile,
  });

  return newProfile;
};
