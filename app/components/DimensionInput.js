"use client";
import {
  Card,
  InputNumber,
  Select,
  Space,
  Divider,
  Button,
  message,
  Alert,
  Input,
} from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import React, { useState, useEffect } from "react";
import { produce } from "immer";

const { Option } = Select;

function DimensionInput({ shapes, updateShapes, unit, setUnit }) {
  const [dimensions, setDimensions] = useState([]);
  const [totalWidth, setTotalWidth] = useState(0);
  const [totalHeight, setTotalHeight] = useState(0);

  // Calculate dimensions when shapes change
  useEffect(() => {
    if (shapes.length > 0 && shapes[0].points.length >= 2) {
      const shape = shapes[0];
      const newDimensions = [];

      // Calculate bounding box
      const xs = shape.points.map((p) => p[0]);
      const ys = shape.points.map((p) => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      setTotalWidth(maxX - minX);
      setTotalHeight(maxY - minY);

      // Calculate each side length
      for (let i = 0; i < shape.points.length; i++) {
        const current = shape.points[i];
        const next = shape.points[(i + 1) % shape.points.length];
        const dx = next[0] - current[0];
        const dy = next[1] - current[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        newDimensions.push({
          key: i,
          side: `Side ${i + 1}`,
          startPoint: i + 1,
          endPoint: ((i + 1) % shape.points.length) + 1,
          length: length,
          angle: angle,
        });
      }

      setDimensions(newDimensions);
    }
  }, [shapes]);

  // Convert pixels to unit
  const pixelsToUnit = (pixels) => {
    const inches = pixels / 12;
    if (unit === "mm") {
      return inches * 25.4;
    } else {
      return inches * 2.54;
    }
  };

  // Convert unit to pixels
  const unitToPixels = (value) => {
    if (unit === "mm") {
      return (value / 25.4) * 12;
    } else {
      return (value / 2.54) * 12;
    }
  };

  // Handle dimension change
  const handleDimensionChange = (index, newLength) => {
    if (shapes.length === 0 || !newLength) return;

    const shape = shapes[0];
    const current = shape.points[index];
    const nextIndex = (index + 1) % shape.points.length;
    const next = shape.points[nextIndex];

    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentLength === 0) return;

    const newPixelLength = unitToPixels(newLength);
    const scale = newPixelLength / currentLength;

    const newX = current[0] + dx * scale;
    const newY = current[1] + dy * scale;

    const updatedShapes = produce(shapes, (draft) => {
      draft[0].points[nextIndex] = [newX, newY];
    });

    updateShapes(updatedShapes);
    message.success(`Side ${index + 1} updated`);
  };

  // Handle total width/height change
  const handleTotalDimensionChange = (dimension, value) => {
    if (shapes.length === 0 || !value) return;

    const shape = shapes[0];
    const xs = shape.points.map((p) => p[0]);
    const ys = shape.points.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const currentWidth = maxX - minX;
    const currentHeight = maxY - minY;

    const newPixelValue = unitToPixels(value);

    let scaleX = 1;
    let scaleY = 1;

    if (dimension === "width" && currentWidth > 0) {
      scaleX = newPixelValue / currentWidth;
    } else if (dimension === "height" && currentHeight > 0) {
      scaleY = newPixelValue / currentHeight;
    }

    const updatedShapes = produce(shapes, (draft) => {
      draft[0].points = draft[0].points.map(([x, y]) => [
        minX + (x - minX) * scaleX,
        minY + (y - minY) * scaleY,
      ]);
    });

    updateShapes(updatedShapes);
    message.success(`Total ${dimension} updated`);
  };

  // Scale entire shape proportionally
  const scaleShape = (scaleFactor) => {
    if (shapes.length === 0) return;

    const shape = shapes[0];
    const xs = shape.points.map((p) => p[0]);
    const ys = shape.points.map((p) => p[1]);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    const updatedShapes = produce(shapes, (draft) => {
      draft[0].points = draft[0].points.map(([x, y]) => [
        centerX + (x - centerX) * scaleFactor,
        centerY + (y - centerY) * scaleFactor,
      ]);
    });

    updateShapes(updatedShapes);
    message.success(`Shape scaled by ${scaleFactor}x`);
  };

  if (shapes.length === 0) {
    return (
      <Card title="📏 Dimensions" size="small" className="shadow-md">
        <Alert
          type="info"
          title="No shape available"
          description="Create or upload a shape to edit dimensions."
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <span>📏 Dimensions</span>
          <Select
            value={unit}
            onChange={setUnit}
            size="small"
            style={{ width: 70 }}
          >
            <Option value="mm">mm</Option>
            <Option value="cm">cm</Option>
          </Select>
        </div>
      }
      size="small"
      className="shadow-md"
    >
      <Space orientation="vertical" className="w-full" size="small">
        {/* Total Dimensions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2 text-blue-700 flex items-center gap-1">
            <ExpandOutlined />
            Total Size
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Width ({unit})
              </label>
              <InputNumber
                value={parseFloat(pixelsToUnit(totalWidth).toFixed(2))}
                onChange={(value) => handleTotalDimensionChange("width", value)}
                min={10}
                step={unit === "mm" ? 10 : 1}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Height ({unit})
              </label>
              <InputNumber
                value={parseFloat(pixelsToUnit(totalHeight).toFixed(2))}
                onChange={(value) =>
                  handleTotalDimensionChange("height", value)
                }
                min={10}
                step={unit === "mm" ? 10 : 1}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Quick Scale Buttons */}
        <div className="flex gap-2">
          <Button size="small" onClick={() => scaleShape(0.5)} block>
            50%
          </Button>
          <Button size="small" onClick={() => scaleShape(0.75)} block>
            75%
          </Button>
          <Button size="small" onClick={() => scaleShape(1.25)} block>
            125%
          </Button>
          <Button size="small" onClick={() => scaleShape(1.5)} block>
            150%
          </Button>
          <Button size="small" onClick={() => scaleShape(2)} block>
            200%
          </Button>
        </div>

        <Divider style={{ margin: "8px 0" }}>Side Lengths</Divider>

        {/* Side Dimensions List */}
        <div className="max-h-48 overflow-y-auto space-y-2">
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="w-16 text-xs font-medium text-gray-600">
                {dim.side}
              </div>
              <div className="text-xs text-gray-400">
                P{dim.startPoint}→P{dim.endPoint}
              </div>

              <Space.Compact>
                <InputNumber
                  value={parseFloat(pixelsToUnit(dim.length).toFixed(2))}
                  onChange={(value) => handleDimensionChange(dim.key, value)}
                  min={1}
                  step={unit === "mm" ? 1 : 0.1}
                  size="small"
                  style={{ flex: 1 }}
                />
                <Input
                  value={unit}
                  size="small"
                  disabled
                  style={{ width: 60, textAlign: "center" }}
                />
              </Space.Compact>

              <div className="w-12 text-xs text-gray-400 text-right">
                {dim.angle.toFixed(0)}°
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-green-50 p-2 rounded text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Points:</span>
            <span className="font-medium">{shapes[0]?.points.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Sides:</span>
            <span className="font-medium">{dimensions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shape Type:</span>
            <span className="font-medium">
              {shapes[0]?.closed ? "Closed" : "Open"}
            </span>
          </div>
        </div>
      </Space>
    </Card>
  );
}

export default DimensionInput;
