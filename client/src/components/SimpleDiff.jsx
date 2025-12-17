export default function SimpleDiff({ oldValue = '', newValue = '' }) {
  const oldLines = String(oldValue || '').split(/\r?\n/);
  const newLines = String(newValue || '').split(/\r?\n/);
  const max = Math.max(oldLines.length, newLines.length);

  return (
    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
      <div className="border-r dark:border-gray-600 pr-2">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-semibold dark:text-white">
          Current
        </div>
        <div className="p-2">
          {Array.from({ length: max }).map((_, i) => {
            const o = oldLines[i] ?? '';
            const n = newLines[i] ?? '';
            const changed = o !== n;
            return (
              <div
                key={`old-${i}`}
                className={`whitespace-pre-wrap ${changed ? 'bg-red-50 dark:bg-red-900/30' : ''} p-1 dark:text-gray-200`}
              >
                <span className="text-gray-400 dark:text-gray-500 mr-2">
                  {String(i + 1).padStart(3, ' ')}{' '}
                </span>
                <span>{o}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-semibold dark:text-white">
          Suggested
        </div>
        <div className="p-2">
          {Array.from({ length: max }).map((_, i) => {
            const o = oldLines[i] ?? '';
            const n = newLines[i] ?? '';
            const changed = o !== n;
            return (
              <div
                key={`new-${i}`}
                className={`whitespace-pre-wrap ${changed ? 'bg-green-50 dark:bg-green-900/30' : ''} p-1 dark:text-gray-200`}
              >
                <span className="text-gray-400 dark:text-gray-500 mr-2">
                  {String(i + 1).padStart(3, ' ')}{' '}
                </span>
                <span>{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
