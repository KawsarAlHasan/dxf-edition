"use client";
import { Card, Button, Space, InputNumber, Alert, Divider, Table, Popconfirm, message, Badge } from "antd";
import { PlusOutlined, DeleteOutlined, AimOutlined, EditOutlined } from "@ant-design/icons";
import React, { useState } from "react";

function DrillingHoles({ 
  drillingHoles, 
  setDrillingHoles, 
  isPlacingHole, 
  setIsPlacingHole, 
  setToolMode,
  shapes 
}) {
  const [editingHole, setEditingHole] = useState(null);
  const [editX, setEditX] = useState(0);
  const [editY, setEditY] = useState(0);

  const HOLE_DIAMETER = 6; // Fixed 6mm diameter
  const MIN_HOLES = 2;

  // Start placing hole
  const startPlacingHole = () => {
    setIsPlacingHole(true);
    setToolMode("place-hole");
    message.info("Click inside the shape to place a drilling hole");
  };

  // Delete hole
  const deleteHole = (holeId) => {
    setDrillingHoles(drillingHoles.filter(h => h.id !== holeId));
    message.success("Hole deleted");
  };

  // Start editing hole position
  const startEditingHole = (hole) => {
    setEditingHole(hole.id);
    setEditX(Math.round(hole.x));
    setEditY(Math.round(hole.y));
  };

  // Save hole position
  const saveHolePosition = (holeId) => {
    setDrillingHoles(drillingHoles.map(h => 
      h.id === holeId ? { ...h, x: editX, y: editY } : h
    ));
    setEditingHole(null);
    message.success("Hole position updated");
  };

  // Calculate distance from edge
  const getDistanceFromEdge = (hole) => {
    if (shapes.length === 0 || !shapes[0].points) return { top: 0, left: 0, right: 0, bottom: 0 };
    
    const points = shapes[0].points;
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      left: Math.round(hole.x - minX),
      right: Math.round(maxX - hole.x),
      top: Math.round(hole.y - minY),
      bottom: Math.round(maxY - hole.y),
    };
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 40,
      render: (_, __, idx) => (
        <Badge count={idx + 1} style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: 'X',
      dataIndex: 'x',
      key: 'x',
      width: 80,
      render: (x, record) => (
        editingHole === record.id ? (
          <InputNumber
            value={editX}
            onChange={(val) => setEditX(val || 0)}
            size="small"
            style={{ width: 70 }}
          />
        ) : (
          <span>{Math.round(x)}px</span>
        )
      ),
    },
    {
      title: 'Y',
      dataIndex: 'y',
      key: 'y',
      width: 80,
      render: (y, record) => (
        editingHole === record.id ? (
          <InputNumber
            value={editY}
            onChange={(val) => setEditY(val || 0)}
            size="small"
            style={{ width: 70 }}
          />
        ) : (
          <span>{Math.round(y)}px</span>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          {editingHole === record.id ? (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => saveHolePosition(record.id)}
            >
              Save
            </Button>
          ) : (
            <>
              <Button 
                size="small" 
                icon={<EditOutlined />} 
                onClick={() => startEditingHole(record)}
              />
              <Popconfirm
                title="Delete this hole?"
                onConfirm={() => deleteHole(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const holesNeeded = MIN_HOLES - drillingHoles.length;
  const isValid = drillingHoles.length >= MIN_HOLES;

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <span>🕳️ Drilling Holes</span>
          <Badge 
            count={drillingHoles.length} 
            style={{ backgroundColor: isValid ? '#52c41a' : '#ff4d4f' }} 
          />
        </div>
      }
      size="small" 
      className="shadow-md"
    >
      <Space orientation="vertical" className="w-full" size="small">
        {/* Status Alert */}
        {!isValid ? (
          <Alert
            type="warning"
            title={`${holesNeeded} more hole${holesNeeded > 1 ? 's' : ''} required`}
            description="Minimum 2 drilling holes are required for mounting."
            showIcon
          />
        ) : (
          <Alert
            type="success"
            title="Minimum holes requirement met ✓"
            showIcon
          />
        )}

        {/* Hole Specifications */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-700 mb-1">Hole Specifications</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Diameter:</span>
              <span className="ml-2 font-medium">{HOLE_DIAMETER}mm (fixed)</span>
            </div>
            <div>
              <span className="text-gray-500">Placed:</span>
              <span className="ml-2 font-medium">{drillingHoles.length} holes</span>
            </div>
          </div>
        </div>

        {/* Add Hole Button */}
        <Button
          type={isPlacingHole ? "default" : "primary"}
          icon={isPlacingHole ? <AimOutlined spin /> : <PlusOutlined />}
          onClick={startPlacingHole}
          block
          size="large"
          disabled={isPlacingHole}
          className={isPlacingHole ? "animate-pulse" : ""}
        >
          {isPlacingHole ? "Click on Canvas to Place Hole..." : "Add Drilling Hole"}
        </Button>

        {isPlacingHole && (
          <Alert
            type="info"
            title="Placing Mode Active"
            description="Click inside the shape boundary to place a 6mm drilling hole."
            showIcon
          />
        )}

        <Divider style={{ margin: "8px 0" }}>Placed Holes</Divider>

        {/* Holes Table */}
        {drillingHoles.length > 0 ? (
          <Table
            dataSource={drillingHoles.map((h, idx) => ({ ...h, key: h.id }))}
            columns={columns}
            size="small"
            pagination={false}
            scroll={{ y: 200 }}
          />
        ) : (
          <div className="text-center text-gray-400 py-4">
            <AimOutlined style={{ fontSize: 32 }} />
            <div className="mt-2">No holes placed yet</div>
          </div>
        )}

        {/* Distance from Edges */}
        {drillingHoles.length > 0 && (
          <>
            <Divider style={{ margin: "8px 0" }}>Distance from Edges</Divider>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {drillingHoles.map((hole, idx) => {
                const distances = getDistanceFromEdge(hole);
                return (
                  <div key={hole.id} className="bg-gray-50 p-2 rounded text-xs">
                    <div className="font-medium mb-1">Hole {idx + 1}</div>
                    <div className="grid grid-cols-4 gap-1">
                      <span>↑ {distances.top}px</span>
                      <span>↓ {distances.bottom}px</span>
                      <span>← {distances.left}px</span>
                      <span>→ {distances.right}px</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Quick Position Input */}
        {drillingHoles.length < 4 && (
          <>
            <Divider style={{ margin: "8px 0" }}>Quick Add by Position</Divider>
            <QuickHoleInput 
              drillingHoles={drillingHoles}
              setDrillingHoles={setDrillingHoles}
              shapes={shapes}
            />
          </>
        )}
      </Space>
    </Card>
  );
}

// Quick Hole Input Component
function QuickHoleInput({ drillingHoles, setDrillingHoles, shapes }) {
  const [xOffset, setXOffset] = useState(50);
  const [yOffset, setYOffset] = useState(50);

  const addHoleByOffset = () => {
    if (shapes.length === 0 || !shapes[0].points) {
      message.warning("No shape available");
      return;
    }

    const points = shapes[0].points;
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    const newHole = {
      id: `hole-${Date.now()}`,
      x: minX + xOffset,
      y: minY + yOffset,
      diameter: 6,
    };

    setDrillingHoles([...drillingHoles, newHole]);
    message.success("Hole added at specified position");
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-gray-500">X from left edge (px)</label>
          <InputNumber
            value={xOffset}
            onChange={(val) => setXOffset(val || 50)}
            min={10}
            style={{ width: "100%" }}
            size="small"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Y from top edge (px)</label>
          <InputNumber
            value={yOffset}
            onChange={(val) => setYOffset(val || 50)}
            min={10}
            style={{ width: "100%" }}
            size="small"
          />
        </div>
      </div>
      <Button onClick={addHoleByOffset} size="small" block>
        Add Hole at Position
      </Button>
    </div>
  );
}

export default DrillingHoles;