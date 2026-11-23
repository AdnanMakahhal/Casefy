import Subscriptions from "./Subscriptions";
import Inbox from "./Inbox";

export default function StaffSections({ view, revision, onLoadingChange }) {
  if (view === "subscriptions") return <Subscriptions revision={revision} onLoadingChange={onLoadingChange} />;
  return (
    <Inbox
      key={view}
      revision={revision}
      onLoadingChange={onLoadingChange}
    />
  );
}
