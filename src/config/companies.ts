export interface CompanyConfig {
  id: string;
  name: string;
  hostnames: string[];
  logoUrl?: string;
  primaryColor: string; // Hex color code
  accentColor: string;  // Hex color code for secondary elements
  address: string;
  email: string;
  phone: string;
  instagram?: string;
}

export const mareMeuaCompany: CompanyConfig = {
  id: 'maremeua',
  name: 'Mare Meua',
  hostnames: ['localhost', 'maremeua.localhost', 'maremeua.com', 'maremeuaestudio.com', 'www.maremeuaestudio.com'],
  logoUrl: '/maremeua-logo.jpeg',
  primaryColor: '#6366F1', // Indigo
  accentColor: '#06B6D4', // Cyan
  address: '',
  email: '',
  phone: '+57 320 2465253',
  instagram: 'https://www.instagram.com/maremeua_studio/'
};

export const companies: CompanyConfig[] = [mareMeuaCompany];

export const defaultCompany: CompanyConfig = mareMeuaCompany;

export function getCompanyByHostname(_hostname: string): CompanyConfig {
  return mareMeuaCompany;
}
