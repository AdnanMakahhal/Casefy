import Integrations from "./Integrations";
import Subscriptions from "./Subscriptions";
import Payments from "./Payments";
import Refunds from "./Refunds";
import ReportsSection from "./ReportsSection";
import Inbox from "./Inbox";

export default function StaffSections({ view, revision }) {
  if (view === "integrations") return <Integrations revision={revision} />;
  if (view === "subscriptions") return <Subscriptions revision={revision} />;
  if (view === "payments") return <Payments revision={revision} />;
  if (view === "refunds") return <Refunds revision={revision} />;
  if (view === "reports") return <ReportsSection revision={revision} />;
  return (
    <Inbox
      key={view}
      category={view === "enterprise" ? "enterprise" : "support"}
      revision={revision}
    />
  );
}
