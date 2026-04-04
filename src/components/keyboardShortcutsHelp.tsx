export type ShortcutEntry = {
  keys: string;
  description: string;
};

type ShortcutGroup = {
  title: string;
  shortcuts: ShortcutEntry[];
};

const KeyBadge = ({ label }: { label: string }) => (
  <kbd className="kbd kbd-sm min-w-[1.75rem] text-center">{label}</kbd>
);

const parseKeys = (keys: string) =>
  keys.split("+").map((k) => k.trim());

export default function KeyboardShortcutsHelp({
  groups,
  onClose,
}: {
  groups: ShortcutGroup[];
  onClose: () => void;
}) {
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          <div className="flex items-center gap-2 text-xs text-base-content/50">
            Press <KeyBadge label="?" /> to close
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
                {group.title}
              </h3>
              <div className="flex flex-col gap-1.5">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-base-200/60"
                  >
                    <span className="text-sm">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {parseKeys(s.keys).map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-xs text-base-content/30">+</span>
                          )}
                          <KeyBadge label={k} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center text-xs text-base-content/40">
          Shortcuts are disabled while typing in an input field
        </div>
      </div>
    </div>
  );
}
