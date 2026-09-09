import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type CompanyPageProps = {
  params: Promise<{ company: string }>;
};

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { company } = await params;
  redirect(`/companies/${company}/jobs`);
}
