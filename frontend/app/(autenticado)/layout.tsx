import { Sidebar } from "@/components/sidebar";

export default function AutenticadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col bg-papel">{children}</div>
    </div>
  );
}
