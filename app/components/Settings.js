import { Card, InputNumber, Space, Switch } from "antd";
import React from "react";

function Settings({
  gridSize,
  setGridSize,
  gridVisible,
  setGridVisible,
  snapToGrid,
  setSnapToGrid,
  showMeasurements,
  setShowMeasurements,
}) {
  return (
    <div>
      <Card title="⚙️ Settings" size="small" className="shadow-md">
        <Space orientation="vertical" className="w-full" size="small">
          <div>
            <label className="block text-sm font-medium mb-2">
              Grid Size: {gridSize}"
            </label>
            <InputNumber
              value={gridSize}
              onChange={(value) => setGridSize(value || 0.5)}
              min={0.1}
              max={12}
              step={0.1}
              style={{ width: "100%" }}
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Show Grid</span>
            <Switch checked={gridVisible} onChange={setGridVisible} />
          </div>
          <div className="flex justify-between items-center">
            <span>Snap to Grid</span>
            <Switch checked={snapToGrid} onChange={setSnapToGrid} />
          </div>
          <div className="flex justify-between items-center">
            <span>Show Measurements</span>
            <Switch checked={showMeasurements} onChange={setShowMeasurements} />
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default Settings;
