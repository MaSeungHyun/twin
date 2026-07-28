import { useCallback, useEffect } from "react";

import { BottomDock } from "@/components/layout/BottomDock";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { OverlayPanel } from "@/components/layout/OverlayPanel";
import OfficeUI from "@/components/model/OfficeUI";
import { AlarmPanel } from "@/components/panels/AlarmPanel";
import { RightPanel, rightPanelTitle } from "@/components/panels/RightPanel";
import { useAlarms } from "@/hooks/useAlarms";
import { useDevices } from "@/hooks/useDevices";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useUiStore } from "@/stores/uiStore";
// import { ThreeViewport } from "@/three/ThreeViewport";

export function ControlShell() {
  const leftPanelOpen = useUiStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const rightPanelMode = useUiStore((s) => s.rightPanelMode);
  const cctvExpanded = useUiStore((s) => s.cctvExpanded);
  const toggleLeftPanel = useUiStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const toggleCctvExpanded = useUiStore((s) => s.toggleCctvExpanded);
  const dismissFocus = useUiStore((s) => s.dismissFocus);

  const isCctv = rightPanelMode === "cctv";

  const handleEscape = useCallback(() => {
    const ui = useUiStore.getState();
    if (ui.cctvExpanded) {
      ui.toggleCctvExpanded();
      return;
    }
    if (ui.selectedAlarmId || ui.selectedDeviceId) {
      dismissFocus();
      return;
    }
    if (ui.leftPanelOpen) {
      ui.toggleLeftPanel();
      return;
    }
    if (ui.rightPanelOpen) {
      ui.toggleRightPanel();
    }
  }, [dismissFocus]);

  useEscapeKey(handleEscape);
  useAlarms();
  useDevices();

  const refreshSchedule = useScheduleStore((s) => s.refresh);
  useEffect(() => {
    void refreshSchedule();
  }, [refreshSchedule]);

  return (
    <div className="app-shell">
      <HeaderBar />

      <div className="app-shell__overlay">
        <OverlayPanel
          side="left"
          open={leftPanelOpen && !(isCctv && cctvExpanded)}
          onClose={toggleLeftPanel}
          title="알람"
        >
          <AlarmPanel />
        </OverlayPanel>

        <OverlayPanel
          side="right"
          open={rightPanelOpen}
          onClose={toggleRightPanel}
          title={rightPanelTitle(rightPanelMode)}
          wide={isCctv}
          expanded={isCctv && cctvExpanded}
          onToggleExpand={isCctv ? toggleCctvExpanded : undefined}
        >
          <RightPanel />
        </OverlayPanel>
      </div>

      <OfficeUI />
      <BottomDock />
    </div>
  );
}
