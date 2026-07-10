import { Sidebar } from "@/components/sidebar";

export default function AutenticadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full w-full min-w-0 flex-1 flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-papel">{children}</div>
    </div>
  );
}
