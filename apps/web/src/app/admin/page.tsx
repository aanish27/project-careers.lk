import { verifySession } from '@/lib/session';

export default async function AdminHomePage() {
  const { user } = await verifySession();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Welcome, {user.firstName}</h1>
    </div>
  );
}
