import { generateUniqueSlug, PrismaClient } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma: PrismaClient = new PrismaClient({ adapter });

const companies = [
  {
    name: 'Brandix',
    websiteUrl: 'https://www.brandix.com',
    careerUrl:
      'https://careers.brandix.com/go/All-Current-Job-Openings/507244/?q=&sortColumn=referencedate&sortDirection=desc',
  },
  {
    name: 'EGMH',
    websiteUrl: 'https://egmh.fa.us6.oraclecloud.com',
    careerUrl:
      'https://egmh.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/jobs?mode=location',
  },
  {
    name: 'Dialog',
    websiteUrl: 'https://www.dialog.lk',
    careerUrl:
      'https://hcmcloud.dialog.lk/CareerPortal/Careers?q=bEopnWmcv9llMiBG3zygOw%3D%3D',
  },
  {
    name: 'WSO2',
    websiteUrl: 'https://wso2.com',
    careerUrl: 'https://wso2.com/careers/#availableposition',
  },
  {
    name: 'Virtusa',
    websiteUrl: 'https://www.virtusa.com',
    careerUrl: 'https://www.virtusa.com/careers/job-search',
  },
  {
    name: 'IFS',
    websiteUrl: 'https://www.ifs.com',
    careerUrl: 'https://www.ifs.com/en/about/careers',
  },
  {
    name: 'Sysco',
    websiteUrl: 'https://www.sysco.com',
    careerUrl:
      'https://wd5.myworkdaysite.com/recruiting/sysco/syscocareers/jobs?locations=b014cc62fe6601b8d666502cd5287f36',
  },
  {
    name: 'PickMe',
    websiteUrl: 'https://pickme.lk',
    careerUrl: 'https://pickme.lk/careers/#current-job-openings',
  },
  {
    name: 'Daraz',
    websiteUrl: 'https://careers.daraz.com',
    careerUrl: 'https://careers.daraz.com/en/off-campus/position-list?lang=en',
  },
  {
    name: '99x',
    websiteUrl: 'https://99x.io',
    careerUrl: 'https://99x.io/careers/open-positions?location=sri-lanka',
  },
];

async function main() {
  for (const data of companies) {
    const slug = await generateUniqueSlug(slugify(data.name), (candidate) =>
      prisma.company
        .findUnique({ where: { slug: candidate } })
        .then((existing) => existing !== null),
    );
    const company = await prisma.company.create({ data: { ...data, slug } });
    console.log(
      `Inserted: ${company.name} - ${company.careerUrl} (${company.id})`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
