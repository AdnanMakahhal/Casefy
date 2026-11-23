import Button from "./Button";
import { useSupportChat } from "../features/support-chat/context";

export default function SupportButton({ category, children = "Contact support", onClick, ...props }) {
  const { openChat } = useSupportChat();
  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) openChat(category);
      }}
    >
      {children}
    </Button>
  );
}
