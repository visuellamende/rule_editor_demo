import { ReactNode } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './Header';
import './AppShell.css';

interface AppShellProps {
  sidebar: ReactNode;
  canvas: ReactNode;
  panel: ReactNode;
}

export function AppShell({ sidebar, canvas, panel }: AppShellProps) {
  return (
    <div className="app-shell">
      <Header />
      <PanelGroup direction="horizontal" className="app-shell__body">
        <Panel
          defaultSize={15}
          minSize={10}
          maxSize={25}
          className="app-shell__sidebar"
        >
          {sidebar}
        </Panel>

        <PanelResizeHandle className="app-shell__resize-handle" />

        <Panel
          minSize={30}
          className="app-shell__canvas"
        >
          {canvas}
        </Panel>

        <PanelResizeHandle className="app-shell__resize-handle" />

        <Panel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          className="app-shell__panel"
        >
          {panel}
        </Panel>
      </PanelGroup>
    </div>
  );
}
