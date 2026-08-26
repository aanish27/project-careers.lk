import { SeoInputObject, SeoPageType } from '@careerslk/types';

export interface SeoTemplateOutput {
  title: string;
  metaDescription: string;
  h1: string;
  introText: string;
  bottomText: string;
}

/**
 * Deterministic variant selection from a slug — the same page always gets
 * the same variant on every regeneration, so re-running generation never
 * shuffles copy (needed for 12.14's title/description uniqueness check to
 * be stable across runs).
 */
function pickVariant<T>(variants: readonly T[], slug: string): T {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return variants[hash % variants.length];
}

function joinList(values: string[]): string {
  if (values.length === 0) return 'a range of';
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`;
}

/**
 * Template variant count is intentionally 3 per page type rather than
 * SRS 12.11.6's 5-10 — a scoped-down first pass. Adding more variants later
 * is a config-only change (just append to these arrays), not an
 * architectural one.
 */

function roleTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  const role = input.role!;
  const jobTypes = joinList(input.jobTypes);
  return [
    {
      title: `${role} Jobs in Sri Lanka`,
      metaDescription: `Browse the latest ${role} job openings in Sri Lanka. Updated daily across ${input.companyCount} companies.`,
      h1: `${role} Jobs`,
      introText: `Browse ${input.jobCount} ${role} jobs in Sri Lanka across ${input.companyCount} companies. Explore ${jobTypes} opportunities and discover openings that match skills such as ${joinList(input.topSkills)}.`,
      bottomText: `${role} jobs in Sri Lanka are available across startups and established employers. Opportunities may include ${jobTypes} roles and different work modes such as ${joinList(input.workModes)}. Candidates with experience in ${joinList(input.topSkills)} may find relevant openings depending on employer requirements.`,
    },
    {
      title: `Find ${role} Jobs — Sri Lanka`,
      metaDescription: `Explore ${role} openings from leading employers across Sri Lanka, including ${jobTypes} opportunities.`,
      h1: `${role} Careers in Sri Lanka`,
      introText: `Explore the latest ${role} jobs in Sri Lanka from leading employers, including ${jobTypes} opportunities.`,
      bottomText: `Employers across Sri Lanka are hiring for ${role} roles, spanning ${jobTypes} arrangements and ${joinList(input.workModes)} work modes. Common skills sought include ${joinList(input.topSkills)}.`,
    },
    {
      title: `${role} Careers — Discover Openings in Sri Lanka`,
      metaDescription: `Discover ${role} careers in Sri Lanka across multiple industries and company types, updated daily.`,
      h1: `${role} Openings`,
      introText: `Discover ${role} careers in Sri Lanka across ${input.companyCount} companies and multiple industries.`,
      bottomText: `${input.jobCount} ${role} openings are currently listed across Sri Lanka, with employers seeking skills such as ${joinList(input.topSkills)} for ${jobTypes} positions.`,
    },
  ];
}

function sectorTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  const sector = input.sector!;
  const jobTypes = joinList(input.jobTypes);
  return [
    {
      title: `${sector} Jobs in Sri Lanka`,
      metaDescription: `Browse ${sector} job openings in Sri Lanka across ${input.companyCount} companies. Updated daily.`,
      h1: `${sector} Jobs`,
      introText: `Browse ${input.jobCount} ${sector} jobs in Sri Lanka across ${input.companyCount} companies, spanning ${jobTypes} opportunities.`,
      bottomText: `The ${sector} sector in Sri Lanka spans a wide range of roles and employers, with common skills including ${joinList(input.topSkills)} and work modes such as ${joinList(input.workModes)}.`,
    },
    {
      title: `${sector} Careers — Sri Lanka`,
      metaDescription: `Explore ${sector} career opportunities from employers hiring across Sri Lanka.`,
      h1: `${sector} Careers`,
      introText: `Explore ${input.jobCount} ${sector} career opportunities from ${input.companyCount} employers hiring across Sri Lanka.`,
      bottomText: `Candidates interested in ${sector} can explore roles spanning ${jobTypes} arrangements, most commonly requiring ${joinList(input.topSkills)}.`,
    },
    {
      title: `Find ${sector} Jobs in Sri Lanka`,
      metaDescription: `Discover ${sector} job openings across multiple companies and locations in Sri Lanka.`,
      h1: `${sector} Openings`,
      introText: `Discover ${input.jobCount} ${sector} job openings across multiple companies and locations in Sri Lanka.`,
      bottomText: `${sector} openings in Sri Lanka span ${joinList(input.workModes)} work modes, with employers commonly seeking ${joinList(input.topSkills)}.`,
    },
  ];
}

function locationTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  const location = input.location!;
  const jobTypes = joinList(input.jobTypes);
  return [
    {
      title: `Jobs in ${location}, Sri Lanka`,
      metaDescription: `Find the latest job vacancies in ${location}. New listings added daily across ${input.companyCount} companies.`,
      h1: `Jobs in ${location}`,
      introText: `Browse ${input.jobCount} jobs in ${location} across ${input.companyCount} companies. Explore ${jobTypes} opportunities in roles requiring ${joinList(input.topSkills)}.`,
      bottomText: `${location} is home to a growing range of employers hiring across ${jobTypes} arrangements. Popular skills among current openings include ${joinList(input.topSkills)}, with work modes spanning ${joinList(input.workModes)}.`,
    },
    {
      title: `${location} Jobs — Latest Vacancies`,
      metaDescription: `Explore new job openings in ${location} from top employers, updated daily.`,
      h1: `Careers in ${location}`,
      introText: `Find new job openings in ${location}, including ${jobTypes} opportunities across ${input.companyCount} companies.`,
      bottomText: `Candidates looking for work in ${location} can explore roles spanning ${jobTypes} arrangements, with employers commonly seeking ${joinList(input.topSkills)}.`,
    },
    {
      title: `Careers in ${location}, Sri Lanka`,
      metaDescription: `Discover career opportunities in ${location} across multiple industries and company types.`,
      h1: `${location} Careers`,
      introText: `Discover careers in ${location} across multiple industries, with ${input.jobCount} active listings.`,
      bottomText: `Employers in ${location} are hiring for roles across ${jobTypes} arrangements and ${joinList(input.workModes)} work modes, most commonly seeking ${joinList(input.topSkills)}.`,
    },
  ];
}

function roleLocationTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  const role = input.role!;
  const location = input.location!;
  const jobTypes = joinList(input.jobTypes);
  return [
    {
      title: `${role} Jobs in ${location}`,
      metaDescription: `Browse ${role} jobs in ${location} from top employers. Explore ${jobTypes} opportunities.`,
      h1: `${role} Jobs in ${location}`,
      introText: `Browse ${input.jobCount} ${role} jobs in ${location} across ${input.companyCount} companies. Explore ${jobTypes} opportunities and discover openings that match skills such as ${joinList(input.topSkills)}.`,
      bottomText: `${role} jobs in ${location} are available across startups and established employers. Opportunities may include ${jobTypes} roles and different work modes such as ${joinList(input.workModes)}. Candidates with experience in ${joinList(input.topSkills)} may find relevant openings depending on employer requirements.`,
    },
    {
      title: `Find ${role} Openings in ${location}`,
      metaDescription: `Find new ${role} openings in ${location}, including ${jobTypes} opportunities.`,
      h1: `${role} Openings in ${location}`,
      introText: `Find new ${role} openings in ${location}, including ${jobTypes} opportunities across ${input.companyCount} companies.`,
      bottomText: `${location} employers are hiring ${role} talent across ${jobTypes} arrangements, most commonly seeking ${joinList(input.topSkills)}.`,
    },
    {
      title: `${role} Careers in ${location}`,
      metaDescription: `Discover ${role} careers in ${location} across multiple industries and company types.`,
      h1: `${role} Careers — ${location}`,
      introText: `Discover ${role} careers in ${location} across multiple industries, with ${input.jobCount} active listings.`,
      bottomText: `${input.jobCount} ${role} roles are currently listed in ${location}, spanning ${joinList(input.workModes)} work modes and requiring skills such as ${joinList(input.topSkills)}.`,
    },
  ];
}

function skillTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  const skill = input.skill!;
  return [
    {
      title: `${skill} Jobs — Find ${skill} Roles`,
      metaDescription: `Browse jobs requiring ${skill} across companies and locations. Find ${joinList(input.jobTypes)} opportunities.`,
      h1: `${skill} Jobs`,
      introText: `Browse ${input.jobCount} jobs requiring ${skill} across ${input.companyCount} companies. Find ${joinList(input.jobTypes)} opportunities in Sri Lanka.`,
      bottomText: `Employers across Sri Lanka are hiring candidates with ${skill} experience for ${joinList(input.jobTypes)} roles, spanning work modes such as ${joinList(input.workModes)}.`,
    },
    {
      title: `Hire or Find Work — ${skill} Jobs`,
      metaDescription: `Explore the latest ${skill} job openings from employers across Sri Lanka.`,
      h1: `${skill} Roles`,
      introText: `Explore the latest ${skill} job openings from ${input.companyCount} employers across Sri Lanka.`,
      bottomText: `${input.jobCount} roles currently list ${skill} as a required or preferred skill, most commonly for ${joinList(input.jobTypes)} positions.`,
    },
    {
      title: `${skill} Careers in Sri Lanka`,
      metaDescription: `Discover ${skill} careers across multiple industries and company types in Sri Lanka.`,
      h1: `${skill} Careers`,
      introText: `Discover ${skill} careers across ${input.companyCount} companies and multiple industries in Sri Lanka.`,
      bottomText: `Candidates with ${skill} skills can explore ${input.jobCount} active openings, spanning ${joinList(input.jobTypes)} arrangements and ${joinList(input.workModes)} work modes.`,
    },
  ];
}

function companyTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  const company = input.company!;
  return [
    {
      title: `Jobs at ${company}`,
      metaDescription: `Explore the latest jobs at ${company}, including current openings, locations, and role categories.`,
      h1: `Jobs at ${company}`,
      introText: `Browse ${input.jobCount} current openings at ${company}, spanning ${joinList(input.jobTypes)} opportunities.`,
      bottomText: `${company} is currently hiring across ${joinList(input.jobTypes)} arrangements and ${joinList(input.workModes)} work modes. Candidates with experience in ${joinList(input.topSkills)} may find relevant openings.`,
    },
    {
      title: `${company} Careers — Current Openings`,
      metaDescription: `Discover current career opportunities at ${company}, updated daily.`,
      h1: `${company} Careers`,
      introText: `Discover ${input.jobCount} career opportunities at ${company}, updated daily.`,
      bottomText: `${company}'s current openings span ${joinList(input.jobTypes)} roles, with common skills sought including ${joinList(input.topSkills)}.`,
    },
    {
      title: `Work at ${company} — Open Roles`,
      metaDescription: `Find open roles at ${company} across multiple departments and locations.`,
      h1: `Open Roles at ${company}`,
      introText: `Find ${input.jobCount} open roles at ${company} across multiple departments.`,
      bottomText: `${company} is hiring for roles spanning ${joinList(input.jobTypes)} arrangements, most commonly seeking ${joinList(input.topSkills)}.`,
    },
  ];
}

function remoteTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  if (input.role) {
    const role = input.role;
    return [
      {
        title: `Remote ${role} Jobs`,
        metaDescription: `Find remote ${role} opportunities across top companies. Work from anywhere.`,
        h1: `Remote ${role} Jobs`,
        introText: `Browse ${input.jobCount} remote ${role} jobs across ${input.companyCount} companies. Work from anywhere in Sri Lanka.`,
        bottomText: `Remote ${role} roles are available across startups and established employers, most commonly requiring ${joinList(input.topSkills)}.`,
      },
      {
        title: `Work Remotely as a ${role}`,
        metaDescription: `Explore remote ${role} openings from employers hiring across Sri Lanka.`,
        h1: `Remote ${role} Careers`,
        introText: `Explore ${input.jobCount} remote ${role} openings from employers hiring across Sri Lanka.`,
        bottomText: `Candidates seeking remote ${role} work can explore roles requiring skills such as ${joinList(input.topSkills)}.`,
      },
      {
        title: `${role} Jobs — Remote`,
        metaDescription: `Discover remote ${role} careers across multiple industries.`,
        h1: `${role} Jobs (Remote)`,
        introText: `Discover ${input.jobCount} remote ${role} careers across ${input.companyCount} companies.`,
        bottomText: `Remote ${role} openings span multiple industries, with employers commonly seeking ${joinList(input.topSkills)}.`,
      },
    ];
  }

  return [
    {
      title: 'Remote Jobs in Sri Lanka',
      metaDescription: `Find remote job opportunities across top companies. Work from anywhere. ${input.jobCount} openings currently listed.`,
      h1: 'Remote Jobs',
      introText: `Browse ${input.jobCount} remote jobs across ${input.companyCount} companies. Work from anywhere in Sri Lanka.`,
      bottomText: `Remote roles are available across startups and established employers, spanning ${joinList(input.jobTypes)} arrangements and requiring skills such as ${joinList(input.topSkills)}.`,
    },
    {
      title: 'Work From Home Jobs — Sri Lanka',
      metaDescription:
        'Explore remote and work-from-home openings from employers hiring across Sri Lanka.',
      h1: 'Work From Home Jobs',
      introText: `Explore ${input.jobCount} remote openings from employers hiring across Sri Lanka.`,
      bottomText: `Candidates seeking remote work can explore roles spanning ${joinList(input.jobTypes)} arrangements, most commonly requiring ${joinList(input.topSkills)}.`,
    },
    {
      title: 'Remote Careers in Sri Lanka',
      metaDescription:
        'Discover remote careers across multiple industries and company types in Sri Lanka.',
      h1: 'Remote Careers',
      introText: `Discover ${input.jobCount} remote careers across ${input.companyCount} companies and multiple industries.`,
      bottomText: `Remote openings span ${joinList(input.jobTypes)} arrangements, with employers commonly seeking ${joinList(input.topSkills)}.`,
    },
  ];
}

function internshipTemplates(input: SeoInputObject): SeoTemplateOutput[] {
  return [
    {
      title: 'Internships in Sri Lanka',
      metaDescription: `Find internship opportunities across top companies in Sri Lanka. ${input.jobCount} openings currently listed.`,
      h1: 'Internships',
      introText: `Browse ${input.jobCount} internship opportunities across ${input.companyCount} companies in Sri Lanka.`,
      bottomText: `Internships currently listed span multiple industries and work modes such as ${joinList(input.workModes)}, with employers commonly seeking ${joinList(input.topSkills)}.`,
    },
    {
      title: 'Find an Internship — Sri Lanka',
      metaDescription:
        'Explore the latest internship openings from employers hiring across Sri Lanka.',
      h1: 'Internship Openings',
      introText: `Explore ${input.jobCount} internship openings from employers hiring across Sri Lanka.`,
      bottomText: `Students and graduates can explore internships spanning ${joinList(input.workModes)} work modes, most commonly requiring exposure to ${joinList(input.topSkills)}.`,
    },
    {
      title: 'Internship Programs in Sri Lanka',
      metaDescription:
        'Discover internship programs across multiple industries and company types in Sri Lanka.',
      h1: 'Internship Programs',
      introText: `Discover ${input.jobCount} internship programs across ${input.companyCount} companies in Sri Lanka.`,
      bottomText: `Internship programs currently listed span multiple industries, with common exposure to ${joinList(input.topSkills)}.`,
    },
  ];
}

const TEMPLATES_BY_PAGE_TYPE: Record<
  SeoPageType,
  (input: SeoInputObject) => SeoTemplateOutput[]
> = {
  [SeoPageType.SECTOR]: sectorTemplates,
  [SeoPageType.ROLE]: roleTemplates,
  [SeoPageType.LOCATION]: locationTemplates,
  [SeoPageType.ROLE_LOCATION]: roleLocationTemplates,
  [SeoPageType.SKILL]: skillTemplates,
  [SeoPageType.COMPANY]: companyTemplates,
  [SeoPageType.REMOTE]: remoteTemplates,
  [SeoPageType.INTERNSHIP]: internshipTemplates,
  // ALL_JOBS/HOME are singleton pages with static default copy — an admin
  // can still override title/intro/bottom/FAQ via manualOverride, same as
  // every other page type.
  [SeoPageType.ALL_JOBS]: () => [
    {
      title: 'Browse Jobs in Sri Lanka',
      metaDescription: 'Explore the latest job openings across Sri Lanka.',
      h1: 'Jobs in Sri Lanka',
      introText: '',
      bottomText: '',
    },
  ],
  [SeoPageType.HOME]: () => [
    {
      title: 'Jobswala — Find Your Next Role in Sri Lanka',
      metaDescription:
        'Jobswala aggregates the latest job openings from companies across Sri Lanka — search by role, location, or company and apply directly.',
      h1: 'Find Your Next Role in Sri Lanka',
      introText: '',
      bottomText: '',
    },
  ],
};

export function generateSeoTemplateOutput(
  input: SeoInputObject,
  slug: string,
): SeoTemplateOutput {
  const variants = TEMPLATES_BY_PAGE_TYPE[input.pageType](input);
  return pickVariant(variants, slug);
}
