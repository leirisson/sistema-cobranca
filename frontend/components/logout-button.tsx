import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-papel/70 transition-colors hover:bg-white/10 hover:text-papel"
      >
        Sair
      </button>
    </form>
  );
}
