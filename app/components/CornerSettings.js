"use client";
import {
  Card,
  Button,
  Space,
  Radio,
  InputNumber,
  Alert,
  Divider,
  Switch,
  message,
  Input,
} from "antd";
import { RadiusSettingOutlined } from "@ant-design/icons";
import React, { useState } from "react";

function CornerSettings({
  shapes,
  cornerSettings,
  setCornerSettings,
  selectedPoint,
}) {
  const [bulkRadius, setBulkRadius] = useState(5);

  if (shapes.length === 0 || !shapes[0].points) {
    return (
      <Card title="🔲 Corner Settings" size="small" className="shadow-md">
        <Alert
          type="info"
          message="No shape available"
          description="Please create or upload a shape first."
          showIcon
        />
      </Card>
    );
  }

  const shape = shapes[0];
  const points = shape.points;

  // Toggle corner type
  const toggleCornerType = (pointIndex) => {
    const current = cornerSettings[pointIndex] || { type: "sharp", radius: 0 };
    const newType = current.type === "sharp" ? "radius" : "sharp";

    setCornerSettings({
      ...cornerSettings,
      [pointIndex]: {
        type: newType,
        radius: newType === "radius" ? 5 : 0,
      },
    });

    message.success(
      `Corner ${pointIndex + 1} set to ${
        newType === "sharp" ? "Sharp" : "Rounded (5mm)"
      }`
    );
  };

  // Update corner radius
  const updateCornerRadius = (pointIndex, radius) => {
    setCornerSettings({
      ...cornerSettings,
      [pointIndex]: {
        type: "radius",
        radius: radius,
      },
    });
  };

  // Set all corners to sharp
  const setAllSharp = () => {
    const newSettings = {};
    points.forEach((_, idx) => {
      newSettings[idx] = { type: "sharp", radius: 0 };
    });
    setCornerSettings(newSettings);
    message.success("All corners set to sharp");
  };

  // Set all corners to radius
  const setAllRadius = () => {
    const newSettings = {};
    points.forEach((_, idx) => {
      newSettings[idx] = { type: "radius", radius: bulkRadius };
    });
    setCornerSettings(newSettings);
    message.success(`All corners set to ${bulkRadius}mm radius`);
  };

  // Count corners by type
  const sharpCount = Object.values(cornerSettings).filter(
    (c) => c.type === "sharp"
  ).length;
  const radiusCount = Object.values(cornerSettings).filter(
    (c) => c.type === "radius"
  ).length;

  return (
    <Card
      title={
        <span>
          <RadiusSettingOutlined className="mr-2" />
          Corner Settings
        </span>
      }
      size="small"
      className="shadow-md"
    >
      <Space orientation="vertical" className="w-full" size="small">
        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>
              Total Corners: <strong>{points.length}</strong>
            </span>
            <span>
              Sharp: <strong className="text-orange-500">{sharpCount}</strong>
            </span>
            <span>
              Rounded: <strong className="text-green-500">{radiusCount}</strong>
            </span>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">Quick Actions</div>
          <div className="flex gap-2 mb-2">
            <Button onClick={setAllSharp} size="small" block>
              All Sharp
            </Button>
            <Button onClick={setAllRadius} type="primary" size="small" block>
              All Rounded
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Bulk Radius:</span>

            <Space.Compact style={{ width: 110 }}>
              <InputNumber
                value={bulkRadius}
                onChange={(val) => setBulkRadius(val || 5)}
                min={1}
                max={50}
                size="small"
                style={{ width: 70 }}
              />
              <Input
                value="mm"
                disabled
                size="small"
                style={{
                  width: 40,
                  textAlign: "center",
                  padding: 0,
                }}
              />
            </Space.Compact>
          </div>
        </div>

        <Divider style={{ margin: "8px 0" }}>Individual Corners</Divider>

        {/* Individual Corner Controls */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {points.map((point, idx) => {
            const corner = cornerSettings[idx] || { type: "sharp", radius: 0 };
            const isSelected = selectedPoint?.pointIndex === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-purple-500 bg-purple-50"
                    : corner.type === "radius"
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        corner.type === "radius"
                          ? "bg-green-500"
                          : "bg-orange-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Corner {idx + 1}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({Math.round(point[0])}, {Math.round(point[1])})
                      </div>
                    </div>
                  </div>

                  <Switch
                    checked={corner.type === "radius"}
                    onChange={() => toggleCornerType(idx)}
                    checkedChildren="R"
                    unCheckedChildren="S"
                  />
                </div>

                {corner.type === "radius" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Radius:</span>
                    <InputNumber
                      value={corner.radius}
                      onChange={(val) => updateCornerRadius(idx, val || 5)}
                      min={1}
                      max={50}
                      size="small"
                      style={{ width: 80 }}
                    />
                    <span className="text-xs text-gray-500">mm</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="bg-gray-100 p-2 rounded text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              Sharp (S)
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              Rounded (R)
            </span>
          </div>
        </div>

        {/* Info */}
        <Alert
          type="info"
          title="Click corners on canvas or toggle here"
          description="Sharp corners have 90° edges. Rounded corners have the specified radius."
          showIcon
          className="text-xs"
        />
      </Space>
    </Card>
  );
}

export default CornerSettings;
