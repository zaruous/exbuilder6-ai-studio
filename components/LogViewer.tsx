
import React from 'react';

interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="flex flex-col h-full bg-black rounded-lg border border-slate-800 overflow-hidden font-mono text-sm">
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-500 uppercase">System Logs</span>
      </div>
      <div className="p-4 overflow-auto flex-1 space-y-1">
        {logs.length > 0 ? (
          logs.map((log, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-blue-400">INFO</span>
              <span className="text-slate-300">{log}</span>
            </div>
          ))
        ) : (
          <div className="text-slate-600 italic">Waiting for process initiation...</div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
