"use client";
import { Card, InputNumber, Space, Switch, Divider, Slider } from "antd";
import { SettingOutlined } from "@ant-design/icons";
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
  showAngles,
  setShowAngles,
}) {
  return (
    <Card
      title={
        <span>
          <SettingOutlined className="mr-2" />
          Canvas Settings
        </span>
      }
      size="small"
      className="shadow-md"
    >
      <Space direction="vertical" className="w-full" size="small">
        {/* Grid Size */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium">Grid Size</label>
            <span className="text-sm text-blue-600 font-mono">{gridSize}"</span>
          </div>
          <Slider
            value={gridSize}
            onChange={(value) => setGridSize(value)}
            min={0.1}
            max={5}
            step={0.1}
            marks={{
              0.1: '0.1"',
              0.5: '0.5"',
              1: '1"',
              2: '2"',
              3: '3"',
              4: '4"',
              5: '5"',
            }}
          />
        </div>

        <Divider style={{ margin: "8px 0" }} />

        {/* Toggle Options */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-medium">Show Grid</div>
              <div className="text-xs text-gray-500">
                Display grid lines on canvas
              </div>
            </div>
            <Switch
              checked={gridVisible}
              onChange={setGridVisible}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>

          <div className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-medium">Snap to Grid</div>
              <div className="text-xs text-gray-500">
                Points align to grid automatically
              </div>
            </div>
            <Switch
              checked={snapToGrid}
              onChange={setSnapToGrid}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>

          <div className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <div>
              <div className="text-sm font-medium">Show Measurements</div>
              <div className="text-xs text-gray-500">
                Display side lengths on shape
              </div>
            </div>
            <Switch
              checked={showMeasurements}
              onChange={setShowMeasurements}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>

          {/* NEW: Show Angles Toggle */}
          {/* <div className="flex justify-between items-center p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors border border-blue-200">
            <div>
              <div className="text-sm font-medium text-blue-700">
                📐 Show Angles
              </div>
              <div className="text-xs text-blue-500">
                Display corner angles in degrees
              </div>
            </div>
            <Switch
              checked={showAngles}
              onChange={setShowAngles}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div> */}
        </div>

        {/* Quick Presets */}
        {/* <Divider style={{ margin: "8px 0" }}>Quick Presets</Divider>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setGridSize(0.25);
              setSnapToGrid(true);
              setShowMeasurements(true);
              if (setShowAngles) setShowAngles(true);
            }}
            className="p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded transition-colors text-blue-700"
          >
            🔬 Precise Mode
          </button>
          <button
            onClick={() => {
              setGridSize(1);
              setSnapToGrid(false);
              setShowMeasurements(false);
              if (setShowAngles) setShowAngles(false);
            }}
            className="p-2 text-xs bg-green-50 hover:bg-green-100 rounded transition-colors text-green-700"
          >
            ✏️ Freehand Mode
          </button>
          <button
            onClick={() => {
              setGridVisible(true);
              setShowMeasurements(true);
              if (setShowAngles) setShowAngles(true);
              setGridSize(0.5);
            }}
            className="p-2 text-xs bg-purple-50 hover:bg-purple-100 rounded transition-colors text-purple-700"
          >
            📐 Design Mode
          </button>
          <button
            onClick={() => {
              setGridVisible(false);
              setShowMeasurements(false);
              if (setShowAngles) setShowAngles(false);
            }}
            className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-700"
          >
            👁️ Preview Mode
          </button>
        </div> */}
      </Space>
    </Card>
  );
}

export default Settings;
