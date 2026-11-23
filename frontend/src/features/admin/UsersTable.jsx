import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { label, number, date } from "./userOptions";
import {
  RiPencilLine as Pencil,
  RiShieldCheckLine as ShieldCheck,
  RiShieldCrossLine as ShieldBan,
  RiDeleteBin6Line as Trash2,
  RiGroupLine as Users
} from "react-icons/ri";

export default function UsersTable({
  users,
  currentId,
  actorRole,
  onEdit,
  onDelete,
  onBlock,
}) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Plan</th>
            <th>Access</th>
            <th>Projects</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((account) => {
            const staff = ["admin", "manager"].includes(account.role);
            const editable =
              actorRole === "admin" ||
              !["admin", "manager"].includes(account.role);
            return (
              <tr key={account.id}>
                <td>
                  <div className="admin-person">
                    <Span className="admin-avatar">
                      {account.name.slice(0, 1).toUpperCase()}
                    </Span>
                    <div>
                      <strong>
                        {account.name}
                        {account.id === currentId && (
                          <Span className="admin-you">You</Span>
                        )}
                      </strong>
                      <Span>{account.email}</Span>
                    </div>
                  </div>
                </td>
                <td>
                  <Span
                    className={`admin-role ${account.role === "admin" ? "is-admin" : ""}`}
                  >
                    {label(account.role)}
                  </Span>
                </td>
                <td>
                  {staff ? <Span className="admin-muted">Not applicable</Span> : <Span className={`admin-plan plan-${account.plan}`}>
                    <i />
                    {label(account.plan)}
                  </Span>}
                </td>
                <td>
                  <Span
                    title={account.blockedReason || "Can sign in"}
                    className={`staff-badge ${account.blockedAt ? "negative" : "positive"}`}
                  >
                    {account.blockedAt ? "Blocked" : "Active"}
                  </Span>
                </td>
                <td>
                  {staff ? "Not applicable" : number(account._count.projects)}
                  {!staff && account.projectLimit && (
                    <Span className="admin-muted">
                      {" "}
                      / {number(account.projectLimit)}
                    </Span>
                  )}
                </td>
                <td className="admin-date">{date(account.createdAt)}</td>
                <td>
                  <div className="admin-row-actions">
                    <Button variant="unstyled" type="submit"
                      className="admin-icon-button"
                      disabled={!editable}
                      aria-label={`Edit ${account.email}`}
                      onClick={() => onEdit(account)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button variant="unstyled" type="submit"
                      className="admin-icon-button"
                      disabled={!editable || account.id === currentId}
                      title={account.blockedAt ? "Unblock user" : "Block user"}
                      aria-label={`${account.blockedAt ? "Unblock" : "Block"} ${account.email}`}
                      onClick={() => onBlock(account)}
                    >
                      {account.blockedAt ? (
                        <ShieldCheck size={17} />
                      ) : (
                        <ShieldBan size={17} />
                      )}
                    </Button>
                    <Button variant="unstyled" type="submit"
                      className="admin-icon-button delete"
                      aria-label={`Delete ${account.email}`}
                      disabled={!editable || account.id === currentId}
                      onClick={() => onDelete(account)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!users.length && (
            <tr>
              <td colSpan={7} className="admin-empty">
                <Users size={28} />
                <strong>No users found</strong>
                <Span>Try a different search or filter.</Span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
