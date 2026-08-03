export const SECTOR_TAXONOMY = {
  "IT & Software": [
    "Software Engineering",
    "UI/UX Design",
    "AI/ML & Data Science",
    "DevOps & Infrastructure",
    "QA & Testing",
    "IT Support & Networks",
  ],
  "Engineering & Construction": [
    "Civil Engineering",
    "Mechanical & Automotive Engineering",
    "Electrical & Electronics Engineering",
    "Architecture & Interior Design",
    "Quantity Surveying",
    "Site Supervision & Quality Control",
    "Drafting & CAD",
  ],
  "Finance & Accounting": [
    "Accounting & Auditing",
    "Banking & Insurance",
    "Investment & Treasury",
    "Payroll",
    "Risk & Compliance",
  ],
  "Sales & Marketing": [
    "Business Development",
    "Digital Marketing",
    "Content & SEO",
    "Retail Sales",
    "Sales Executive",
  ],
  "Human Resources": [
    "Talent Acquisition",
    "Training & Development",
    "People Operations & Compensation",
    "Industrial Relations",
  ],
  "Administration & Management": [
    "Corporate Management",
    "Project Management",
    "Consulting",
    "Business Analysis",
    "Office Administration",
    "Secretarial & Front Office",
    "Procurement & Purchasing",
  ],
  "Customer Service & Support": [
    "Customer Support",
    "Call Centre",
    "BPO/KPO",
    "Collections & Recoveries",
  ],
  "Logistics, Warehouse & Transport": [
    "Logistics & Supply Chain",
    "Warehouse & Stores",
    "Driver",
    "Delivery Rider",
    "Shipping & Freight",
    "Import/Export & Trade",
  ],
  "Manufacturing & Production": [
    "Production & Operations",
    "Factory & Machine Operator",
    "Packing",
    "Technician & Mechanic",
  ],
  "Hospitality & Tourism": [
    "Hotel & Restaurant Management",
    "Chef & Kitchen Staff",
    "Travel & Ticketing",
    "Front Office & Guest Services",
  ],
  "Healthcare & Medical": [
    "Nursing",
    "Medical Practice",
    "Pharmacy",
    "Allied Health",
  ],
  "Education & Training": [
    "Teaching",
    "Curriculum & Academic Administration",
    "Tuition & Coaching",
  ],
  "Media, Communications & Creative": [
    "Graphic Design",
    "Photography & Videography",
    "Content Writing & Editing",
    "Video & Animation",
    "Public Relations & Communications",
    "Advertising",
    "Event Management",
    "Translation",
  ],
  Legal: [
    "Corporate Law",
    "Litigation",
    "Compliance & Regulatory",
    "Intellectual Property",
  ],
  "Apparel & Fashion": [
    "Merchandising & Buying",
    "Garment Production",
    "Fashion Design",
    "Quality Assurance",
  ],
  "General Services": [
    "Security & Defence",
    "Facilities & Cleaning",
    "Beauty & Wellness",
    "Sports & Fitness",
    "Agriculture & Environment",
    "Research & Development / Science",
    "NGO & International Development",
    "Domestic Jobs",
  ],
} as const;

export type Sector = keyof typeof SECTOR_TAXONOMY;

export const SECTORS = Object.keys(SECTOR_TAXONOMY) as Sector[];

export function getCategoriesForSector(sector: string | undefined) {
  if (!sector || !(sector in SECTOR_TAXONOMY)) return [];
  return SECTOR_TAXONOMY[sector as Sector];
}
