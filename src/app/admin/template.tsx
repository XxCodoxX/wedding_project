// A template remounts on every navigation, so the CSS animation replays per page.
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in w-full h-full">{children}</div>;
}
