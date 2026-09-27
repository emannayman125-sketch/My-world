export default function SharedProgress({ myName, partnerName, myItems, partnerItems }) {
  function renderGoals(items) {
    if (!items || items.length === 0) {
      return <p className="text-sm text-ink-muted dark:text-moon-muted">مفيش حاجة مشتركة لسه.</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((g) => (
          <div key={g.id}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span>{g.title}</span>
              <span className="text-ink-muted dark:text-moon-muted">{g.progress ?? g.is_done ? 100 : g.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-lantern" style={{ width: `${g.progress ?? (g.is_done ? 100 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card p-6">
        <h3 className="font-display text-lg mb-3">🎯 {myName}</h3>
        {renderGoals(myItems)}
      </div>
      <div className="card p-6">
        <h3 className="font-display text-lg mb-3">🎯 {partnerName}</h3>
        {renderGoals(partnerItems)}
      </div>
    </div>
  );
}
