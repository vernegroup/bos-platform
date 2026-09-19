import { canManageMembers, requireBOSAccess } from "@/lib/bos/access";
import { listOrganizationMembers } from "@/lib/bos/organizationRepository";
import SubmitButton from "@/components/app-shell/SubmitButton";
import { inviteMemberAction, updateMemberRoleAction } from "./actions";

export const dynamic = "force-dynamic";

const roleLabels = {
  OWNER: "WŁAŚCICIEL",
  ADMIN: "ADMINISTRATOR",
  MANAGER: "MANAGER",
  USER: "UŻYTKOWNIK",
} as const;
const statusLabels = {
  ACTIVE: "AKTYWNY",
  INVITED: "ZAPROSZONY",
  SUSPENDED: "ZAWIESZONY",
} as const;

export default async function UsersPage() {
  const access = await requireBOSAccess();
  const members = await listOrganizationMembers(access);
  const canManage = canManageMembers(access.membership.role);
  const active = members.filter((member) => member.status === "ACTIVE").length;
  const invited = members.filter((member) => member.status === "INVITED").length;
  const managers = members.filter((member) => member.role === "OWNER" || member.role === "ADMIN" || member.role === "MANAGER").length;

  return (
    <div className="bos-app-workspace bos-core-workspace">
      <section className="bos-app-intro bos-core-view-head">
        <div>
          <div className="bos-app-kicker">BOS CORE / UŻYTKOWNICY</div>
          <h1>Użytkownicy</h1>
          <p>Role i członkostwa przypisane do organizacji {access.organization.name}. Uprawnienia są egzekwowane po stronie BOS.</p>
        </div>
        <div className="bos-app-build-state"><span>TWOJA ROLA</span><strong>{roleLabels[access.membership.role]}</strong></div>
      </section>

      <section className="bos-core-commandbar">
        <div><span>WSZYSCY</span><strong>{members.length}</strong></div>
        <div><span>AKTYWNI</span><strong>{active}</strong></div>
        <div><span>ZAPROSZENI</span><strong>{invited}</strong></div>
        <div><span>ZARZĄDZAJĄCY</span><strong>{managers}</strong></div>
      </section>

      <section className="bos-members-list">
        <header><span>OSOBA</span><span>E-MAIL</span><span>ROLA</span><span>STATUS</span><span>CZŁONKOSTWO</span></header>
        {members.map((member) => (
          <article key={member.id}>
            <div className="bos-member-identity"><span>{member.display_name.slice(0, 1).toUpperCase()}</span><strong>{member.display_name}</strong></div>
            <span>{member.email}</span>
            <div>
              {canManage && member.role !== "OWNER" ? (
                <form action={updateMemberRoleAction} className="bos-member-role-form">
                  <input type="hidden" name="membershipId" value={member.id} />
                  <select name="role" defaultValue={member.role} aria-label={`Rola użytkownika ${member.display_name}`}>
                    <option value="ADMIN">Administrator</option>
                    <option value="MANAGER">Manager</option>
                    <option value="USER">Użytkownik</option>
                  </select>
                  <SubmitButton idleLabel="ZAPISZ" pendingLabel="ZAPIS…" />
                </form>
              ) : <b>{roleLabels[member.role as keyof typeof roleLabels]}</b>}
            </div>
            <em data-status={member.status}>{statusLabels[member.status as keyof typeof statusLabels]}</em>
            <small>{member.joined_at ? "DOŁĄCZONO" : "OCZEKUJE NA AKTYWACJĘ"}</small>
          </article>
        ))}
      </section>

      {canManage && (
        <section className="bos-member-invite">
          <div>
            <span className="bos-dashboard-section-kicker">NOWE CZŁONKOSTWO</span>
            <h2>Dodaj użytkownika</h2>
            <p>Użytkownik otrzyma członkostwo wyłącznie w bieżącej organizacji. Roli właściciela nie można nadać z tego formularza.</p>
          </div>
          <form action={inviteMemberAction}>
            <label><span>IMIĘ I NAZWISKO</span><input name="displayName" placeholder="np. Anna Kowalska" required /></label>
            <label><span>ADRES E-MAIL</span><input name="email" type="email" placeholder="anna@firma.pl" required /></label>
            <label><span>ROLA</span><select name="role" defaultValue="USER"><option value="ADMIN">Administrator</option><option value="MANAGER">Manager</option><option value="USER">Użytkownik</option></select></label>
            <SubmitButton idleLabel="DODAJ UŻYTKOWNIKA →" pendingLabel="DODAWANIE…" />
          </form>
        </section>
      )}
    </div>
  );
}
