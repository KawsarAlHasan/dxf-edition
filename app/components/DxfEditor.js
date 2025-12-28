"use client";
import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";
import {
  Button,
  Slider,
  Card,
  Divider,
  Space,
  Tooltip,
  Switch,
  Alert,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  DragOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { produce } from "immer";
import FileOperations from "./FileOperations";
import { showToast } from "nextjs-toast-notify";
import StatusBar from "./StatusBar";
import MainToolbar from "./MainToolbar";

const DxfEditor = () => {
  // State Management
  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [totalArea, setTotalArea] = useState(0);
  const [totalPerimeter, setTotalPerimeter] = useState(0);
  const [scale, setScale] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 700 });
  const [lineWidth, setLineWidth] = useState(2);
  const [toolMode, setToolMode] = useState("select");
  const [gridSize, setGridSize] = useState(0.5);
  const [moveIncrement, setMoveIncrement] = useState(0.5);

  // Refs
  const stageRef = useRef();
  const fileInputRef = useRef();
  const containerRef = useRef();

  // Initialize with sample shapes
  useEffect(() => {
    const sampleShapes = [
      {
        id: "shape-1",
        type: "rectangle",
        points: [
          [100, 100],
          [400, 100],
          [400, 300],
          [100, 300],
        ],
        color: "#1890ff",
        strokeWidth: 2,
        closed: true,
        visible: true,
        locked: false,
        name: "Sample Rectangle",
      },
    ];
    setShapes(sampleShapes);
    updateHistory(sampleShapes);
    calculateMeasurements(sampleShapes);
  }, []);

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setStageSize((prev) => ({ ...prev, width: Math.max(800, width - 40) }));
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Clear selected point when tool mode changes (except select-point)
  useEffect(() => {
    if (toolMode !== "select-point") {
      setSelectedPoint(null);
    }
  }, [toolMode]);

  // Update History
  const updateHistory = (newShapes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newShapes)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Handler for when shapes are loaded from FileOperations
  const handleShapesLoaded = (newShapes) => {
    setShapes(newShapes);
    updateHistory(newShapes);
    calculateMeasurements(newShapes);
    setSelectedShape(null);
    setSelectedPoint(null);
  };

  // Scale/Resize Shape
  const handleScale = (shapeId, scaleFactor) => {
    const updatedShapes = shapes.map((shape) => {
      if (shape.id === shapeId) {
        const center = getShapeCenter(shape.points);
        return {
          ...shape,
          points: shape.points.map((pt) => [
            center.x + (pt[0] - center.x) * scaleFactor,
            center.y + (pt[1] - center.y) * scaleFactor,
          ]),
        };
      }
      return shape;
    });
    updateShapes(updatedShapes);
    showToast.success(`Shape scaled by ${scaleFactor}x`, { duration: 2000 });
  };

  // Drag Points with custom grid snap
  const handlePointDrag = (shapeIndex, pointIndex, newPos) => {
    const updatedShapes = produce(shapes, (draft) => {
      let { x, y } = newPos;

      if (snapToGrid) {
        const snapSize = gridSize * 12;
        x = Math.round(x / snapSize) * snapSize;
        y = Math.round(y / snapSize) * snapSize;
      }

      draft[shapeIndex].points[pointIndex] = [x, y];
    });
    setShapes(updatedShapes);
  };

  const handlePointDragEnd = () => {
    updateHistory(shapes);
    calculateMeasurements(shapes);
  };

  // Move point with arrow keys (precision movement)
  const movePoint = (shapeIndex, pointIndex, direction) => {
    if (!selectedPoint) return;
    const updatedShapes = produce(shapes, (draft) => {
      const point = draft[shapeIndex].points[pointIndex];
      const movePixels = moveIncrement * 12;
      switch (direction) {
        case "up":
          point[1] -= movePixels;
          break;
        case "down":
          point[1] += movePixels;
          break;
        case "left":
          point[0] -= movePixels;
          break;
        case "right":
          point[0] += movePixels;
          break;
      }
    });
    updateShapes(updatedShapes);
  };

  // Add New Point to Line
  const addNewPoint = (shapeIndex, segmentIndex, position) => {
    const updatedShapes = produce(shapes, (draft) => {
      const shape = draft[shapeIndex];
      let { x, y } = position;

      if (snapToGrid) {
        const snapSize = gridSize * 12;
        x = Math.round(x / snapSize) * snapSize;
        y = Math.round(y / snapSize) * snapSize;
      }

      shape.points.splice(segmentIndex + 1, 0, [x, y]);
    });
    updateShapes(updatedShapes);
    showToast.success("New point added", { duration: 2000 });
  };

  // Delete Point
  const deletePoint = (shapeIndex, pointIndex) => {
    const shape = shapes[shapeIndex];

    if (shape.points.length <= 3) {
      showToast.warning("Cannot delete point - minimum 3 points required", {
        duration: 2000,
      });
      return;
    }

    const updatedShapes = produce(shapes, (draft) => {
      draft[shapeIndex].points.splice(pointIndex, 1);
    });
    updateShapes(updatedShapes);
    showToast.success("Point deleted", { duration: 2000 });
  };

  // Calculate Area and Perimeter
  const calculateMeasurements = (shapeList) => {
    let totalArea = 0;
    let totalPerimeter = 0;

    shapeList.forEach((shape) => {
      if (shape.visible && shape.points.length >= 3) {
        if (shape.closed) {
          const area = Math.abs(getPolygonArea(shape.points));
          totalArea += area;
        }
        const perimeter = getPolygonPerimeter(shape.points, shape.closed);
        totalPerimeter += perimeter;
      }
    });

    const areaSqFt = totalArea / 144;
    const perimeterFt = totalPerimeter / 12;

    setTotalArea(areaSqFt);
    setTotalPerimeter(perimeterFt);
  };

  const getPolygonArea = (points) => {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }

    return Math.abs(area / 2);
  };

  const getPolygonPerimeter = (points, closed) => {
    let perimeter = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1][0] - points[i][0];
      const dy = points[i + 1][1] - points[i][1];
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    if (closed && points.length > 2) {
      const dx = points[0][0] - points[points.length - 1][0];
      const dy = points[0][1] - points[points.length - 1][1];
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    return perimeter;
  };

  // Update Shapes Helper
  const updateShapes = (newShapes) => {
    setShapes(newShapes);
    updateHistory(newShapes);
    calculateMeasurements(newShapes);
  };

  // Utility Functions
  const getShapeCenter = (points) => {
    const sum = points.reduce(
      (acc, pt) => ({
        x: acc.x + pt[0],
        y: acc.y + pt[1],
      }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  };

  // Delete Selected Shape
  const deleteSelectedShape = () => {
    if (selectedShape) {
      const updatedShapes = shapes.filter(
        (shape) => shape.id !== selectedShape
      );
      updateShapes(updatedShapes);
      setSelectedShape(null);
      setSelectedPoint(null);
      showToast.success("Shape deleted", { duration: 2000 });
    } else {
      showToast.warning("Please select a shape first", { duration: 2000 });
    }
  };

  // Duplicate Shape
  const duplicateShape = () => {
    if (selectedShape) {
      const original = shapes.find((s) => s.id === selectedShape);
      if (original) {
        const duplicated = {
          ...original,
          id: `${original.id}-copy-${Date.now()}`,
          points: original.points.map((pt) => [pt[0] + 50, pt[1] + 50]),
          name: `${original.name} (Copy)`,
        };
        const updatedShapes = [...shapes, duplicated];
        updateShapes(updatedShapes);
        setSelectedShape(duplicated.id);
        showToast.success("Shape duplicated", { duration: 2000 });
      }
    } else {
      showToast.warning("Please select a shape first", { duration: 2000 });
    }
  };

  // Toggle Shape Visibility
  const toggleShapeVisibility = (shapeId) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, visible: !shape.visible } : shape
    );
    updateShapes(updatedShapes);
  };

  // Toggle Shape Lock
  const toggleShapeLock = (shapeId) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, locked: !shape.locked } : shape
    );
    updateShapes(updatedShapes);
    showToast.success(
      shapes.find((s) => s.id === shapeId)?.locked
        ? "Shape unlocked"
        : "Shape locked",
      { duration: 2000 }
    );
  };

  // Grid Generator with custom grid size
  const renderGrid = () => {
    const gridSizePixels = gridSize * 12;
    const gridLines = [];
    const width = stageSize.width / scale;
    const height = stageSize.height / scale;

    for (let i = 0; i < width; i += gridSizePixels) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, height]}
          stroke="#e0e0e0"
          strokeWidth={0.5 / scale}
          listening={false}
        />
      );
    }

    for (let i = 0; i < height; i += gridSizePixels) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, width, i]}
          stroke="#e0e0e0"
          strokeWidth={0.5 / scale}
          listening={false}
        />
      );
    }

    return gridLines;
  };

  // Calculate bounding box for selected shape
  const getSelectedShapeBoundingBox = () => {
    if (!selectedShape) return null;

    const shape = shapes.find((s) => s.id === selectedShape);
    if (!shape || !shape.points.length) return null;

    const xs = shape.points.map((p) => p[0]);
    const ys = shape.points.map((p) => p[1]);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  };

  // Handle point click based on tool mode
  const handlePointClick = (e, shapeIndex, pointIndex) => {
    e.cancelBubble = true;

    if (toolMode === "delete-point") {
      deletePoint(shapeIndex, pointIndex);
    } else if (toolMode === "select-point") {
      // Toggle selection - if same point clicked, deselect it
      if (
        selectedPoint?.shapeIndex === shapeIndex &&
        selectedPoint?.pointIndex === pointIndex
      ) {
        setSelectedPoint(null);
      } else {
        setSelectedPoint({ shapeIndex, pointIndex });
      }
    }
    // For other modes (select, add-point), do nothing on point click
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 bg-gray-50 min-h-screen">
      {/* Left Sidebar - Tools */}
      <div className="lg:w-80 space-y-4">
        {/* File Operations - Now using separate component */}
        <FileOperations
          stageRef={stageRef}
          fileInputRef={fileInputRef}
          onShapesLoaded={handleShapesLoaded}
        />

        {/* Editing Tools */}
        <Card title="🛠️ Editing Tools" size="small" className="shadow-md">
          <Space orientation="vertical" className="w-full" size="small">
            <div className="grid grid-cols-4 gap-2">
              <Tooltip title="Select & Move Shape">
                <Button
                  type={toolMode === "select" ? "primary" : "default"}
                  icon={<DragOutlined />}
                  onClick={() => setToolMode("select")}
                  style={{ height: 35 }}
                />
              </Tooltip>
              <Tooltip title="Select Point">
                <Button
                  type={toolMode === "select-point" ? "primary" : "default"}
                  icon={<AimOutlined />}
                  onClick={() => setToolMode("select-point")}
                  style={{ height: 35 }}
                />
              </Tooltip>
              <Tooltip title="Add Point">
                <Button
                  type={toolMode === "add-point" ? "primary" : "default"}
                  icon={<PlusOutlined />}
                  onClick={() => setToolMode("add-point")}
                  style={{ height: 35 }}
                />
              </Tooltip>
              <Tooltip title="Delete Point">
                <Button
                  type={toolMode === "delete-point" ? "primary" : "default"}
                  icon={<DeleteOutlined />}
                  onClick={() => setToolMode("delete-point")}
                  style={{ height: 35 }}
                />
              </Tooltip>
            </div>
            <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-100 rounded">
              {toolMode === "select" &&
                "🖱️ Click shape to select, drag points to move"}
              {toolMode === "select-point" &&
                "🎯 Click point to select/deselect for precision editing"}
              {toolMode === "add-point" &&
                "➕ Click on line segment to add new point"}
              {toolMode === "delete-point" && "🗑️ Click point to delete"}
            </div>
          </Space>
        </Card>

        {/* Precision Movement Controls - Only show when point is selected */}
        {selectedPoint && toolMode === "select-point" && (
          <Card
            title="🎯 Precision Movement"
            size="small"
            className="shadow-md border-2 border-purple-400"
          >
            <Space orientation="vertical" className="w-full" size="small">
              <Alert
                title={`Point ${selectedPoint.pointIndex + 1} of ${
                  shapes[selectedPoint.shapeIndex]?.points.length
                }`}
                description={`Position: (${Math.round(
                  shapes[selectedPoint.shapeIndex]?.points[
                    selectedPoint.pointIndex
                  ][0]
                )}, ${Math.round(
                  shapes[selectedPoint.shapeIndex]?.points[
                    selectedPoint.pointIndex
                  ][1]
                )})`}
                type="info"
                showIcon
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Move Increment: {moveIncrement}"
                </label>
                <InputNumber
                  value={moveIncrement}
                  onChange={(value) => setMoveIncrement(value || 0.5)}
                  min={0.1}
                  max={12}
                  step={0.1}
                  style={{ width: "100%" }}
                />
              </div>

              <Divider style={{ margin: "8px 0" }}>Move Point</Divider>

              <div className="grid grid-cols-3 gap-2">
                <div></div>
                <Button
                  type="primary"
                  icon={<ArrowUpOutlined />}
                  onClick={() =>
                    movePoint(
                      selectedPoint.shapeIndex,
                      selectedPoint.pointIndex,
                      "up"
                    )
                  }
                  block
                  size="small"
                >
                  Up
                </Button>
                <div></div>

                <Button
                  type="primary"
                  icon={<ArrowLeftOutlined />}
                  onClick={() =>
                    movePoint(
                      selectedPoint.shapeIndex,
                      selectedPoint.pointIndex,
                      "left"
                    )
                  }
                  block
                  size="small"
                >
                  Left
                </Button>
                <div className="flex items-center justify-center text-xs font-medium bg-gray-100 rounded">
                  {moveIncrement}"
                </div>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={() =>
                    movePoint(
                      selectedPoint.shapeIndex,
                      selectedPoint.pointIndex,
                      "right"
                    )
                  }
                  block
                  size="small"
                >
                  Right
                </Button>

                <div></div>
                <Button
                  type="primary"
                  icon={<ArrowDownOutlined />}
                  onClick={() =>
                    movePoint(
                      selectedPoint.shapeIndex,
                      selectedPoint.pointIndex,
                      "down"
                    )
                  }
                  block
                  size="small"
                >
                  Down
                </Button>
                <div></div>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setSelectedPoint(null)}
                  block
                  size="small"
                >
                  Deselect Point
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    deletePoint(
                      selectedPoint.shapeIndex,
                      selectedPoint.pointIndex
                    );
                    setSelectedPoint(null);
                  }}
                  block
                  size="small"
                >
                  Delete Point
                </Button>
              </div>
            </Space>
          </Card>
        )}

        {/* Shape Properties */}
        {selectedShape && (
          <Card title="🎨 Shape Properties" size="small" className="shadow-md">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Line Width:{" "}
                  {shapes.find((s) => s.id === selectedShape)?.strokeWidth ||
                    lineWidth}
                </label>
                <Slider
                  min={1}
                  max={10}
                  value={
                    shapes.find((s) => s.id === selectedShape)?.strokeWidth ||
                    lineWidth
                  }
                  onChange={(value) => {
                    const updatedShapes = shapes.map((shape) =>
                      shape.id === selectedShape
                        ? { ...shape, strokeWidth: value }
                        : shape
                    );
                    updateShapes(updatedShapes);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Scale</label>
                <div className="flex gap-2">
                  <Button onClick={() => handleScale(selectedShape, 0.8)} block>
                    80%
                  </Button>
                  <Button onClick={() => handleScale(selectedShape, 1.2)} block>
                    120%
                  </Button>
                  <Button onClick={() => handleScale(selectedShape, 1.5)} block>
                    150%
                  </Button>
                </div>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  icon={
                    shapes.find((s) => s.id === selectedShape)?.visible ? (
                      <EyeOutlined />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                  onClick={() => toggleShapeVisibility(selectedShape)}
                  block
                >
                  {shapes.find((s) => s.id === selectedShape)?.visible
                    ? "Hide"
                    : "Show"}
                </Button>
                <Button
                  icon={
                    shapes.find((s) => s.id === selectedShape)?.locked ? (
                      <LockOutlined />
                    ) : (
                      <UnlockOutlined />
                    )
                  }
                  onClick={() => toggleShapeLock(selectedShape)}
                  block
                >
                  {shapes.find((s) => s.id === selectedShape)?.locked
                    ? "Unlock"
                    : "Lock"}
                </Button>
                <Button icon={<CopyOutlined />} onClick={duplicateShape} block>
                  Duplicate
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={deleteSelectedShape}
                  block
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Settings */}
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
              <div className="mt-2 flex gap-1 flex-wrap">
                <Button size="small" onClick={() => setGridSize(0.25)}>
                  1/4"
                </Button>
                <Button size="small" onClick={() => setGridSize(0.5)}>
                  1/2"
                </Button>
                <Button size="small" onClick={() => setGridSize(1)}>
                  1"
                </Button>
                <Button size="small" onClick={() => setGridSize(2)}>
                  2"
                </Button>
              </div>
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
              <Switch
                checked={showMeasurements}
                onChange={setShowMeasurements}
              />
            </div>
          </Space>
        </Card>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1" ref={containerRef}>
        <Card className="shadow-lg">
          {/* Toolbar */}
          <MainToolbar
            setShapes={setShapes}
            setHistoryIndex={setHistoryIndex}
            historyIndex={historyIndex}
            history={history}
            scale={scale}
            setScale={setScale}
            shapes={shapes}
            totalArea={totalArea}
            totalPerimeter={totalPerimeter}
          />

          {/* Canvas */}
          <div
            className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white"
            style={{ position: "relative" }}
          >
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              scaleX={scale}
              scaleY={scale}
            >
              <Layer>
                {/* Grid */}
                {gridVisible && renderGrid()}

                {/* Shapes */}
                {shapes
                  .filter((s) => s.visible)
                  .map((shape, shapeIndex) => {
                    const isSelected = shape.id === selectedShape;
                    const isLocked = shape.locked;

                    return (
                      <Group key={shape.id}>
                        {/* Shape Line */}
                        <Line
                          points={shape.points.flat()}
                          stroke={isSelected ? "#722ed1" : shape.color}
                          strokeWidth={(shape.strokeWidth || lineWidth) / scale}
                          closed={shape.closed}
                          dash={isLocked ? [10 / scale, 5 / scale] : undefined}
                          fill={
                            shape.closed && isSelected
                              ? `${shape.color}20`
                              : undefined
                          }
                          onClick={() =>
                            !isLocked && setSelectedShape(shape.id)
                          }
                          onTap={() => !isLocked && setSelectedShape(shape.id)}
                          listening={!isLocked}
                        />

                        {/* Control Points */}
                        {isSelected &&
                          !isLocked &&
                          shape.points.map((point, pointIndex) => {
                            const isPointSelected =
                              selectedPoint?.shapeIndex === shapeIndex &&
                              selectedPoint?.pointIndex === pointIndex;

                            // Determine if point should be draggable (only in select mode)
                            const isDraggable = toolMode === "select";

                            return (
                              <Circle
                                key={`${shape.id}-point-${pointIndex}`}
                                x={point[0]}
                                y={point[1]}
                                radius={
                                  isPointSelected ? 10 / scale : 8 / scale
                                }
                                fill={isPointSelected ? "#f5222d" : "#722ed1"}
                                stroke="#ffffff"
                                strokeWidth={2 / scale}
                                draggable={isDraggable}
                                onDragMove={(e) => {
                                  if (isDraggable) {
                                    handlePointDrag(
                                      shapeIndex,
                                      pointIndex,
                                      e.target.position()
                                    );
                                  }
                                }}
                                onDragEnd={() => {
                                  if (isDraggable) {
                                    handlePointDragEnd();
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  const container = e.target
                                    .getStage()
                                    .container();
                                  if (toolMode === "delete-point") {
                                    container.style.cursor = "not-allowed";
                                  } else if (toolMode === "select-point") {
                                    container.style.cursor = "pointer";
                                  } else if (toolMode === "select") {
                                    container.style.cursor = "move";
                                  } else {
                                    container.style.cursor = "default";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  const container = e.target
                                    .getStage()
                                    .container();
                                  container.style.cursor = "default";
                                }}
                                onClick={(e) =>
                                  handlePointClick(e, shapeIndex, pointIndex)
                                }
                              />
                            );
                          })}

                        {/* Add Point Hit Areas */}
                        {isSelected &&
                          !isLocked &&
                          toolMode === "add-point" &&
                          shape.points.map((point, segmentIndex) => {
                            if (
                              segmentIndex === shape.points.length - 1 &&
                              !shape.closed
                            )
                              return null;

                            const nextPoint =
                              shape.points[
                                (segmentIndex + 1) % shape.points.length
                              ];
                            const midX = (point[0] + nextPoint[0]) / 2;
                            const midY = (point[1] + nextPoint[1]) / 2;

                            return (
                              <Group key={`add-${segmentIndex}`}>
                                <Line
                                  points={[...point, ...nextPoint]}
                                  stroke="transparent"
                                  strokeWidth={20 / scale}
                                  onClick={(e) => {
                                    e.cancelBubble = true;
                                    const stage = e.target.getStage();
                                    const pos = stage.getPointerPosition();
                                    const transform = stage
                                      .getAbsoluteTransform()
                                      .copy()
                                      .invert();
                                    const relativePos = transform.point(pos);
                                    addNewPoint(
                                      shapeIndex,
                                      segmentIndex,
                                      relativePos
                                    );
                                  }}
                                />
                                <Circle
                                  x={midX}
                                  y={midY}
                                  radius={6 / scale}
                                  fill="#52c41a"
                                  stroke="#ffffff"
                                  strokeWidth={2 / scale}
                                  opacity={0.7}
                                  listening={false}
                                />
                              </Group>
                            );
                          })}

                        {/* Measurements */}
                        {showMeasurements &&
                          isSelected &&
                          shape.points.map((point, idx) => {
                            if (
                              idx === shape.points.length - 1 &&
                              !shape.closed
                            )
                              return null;

                            const nextPoint =
                              shape.points[(idx + 1) % shape.points.length];
                            const midX = (point[0] + nextPoint[0]) / 2;
                            const midY = (point[1] + nextPoint[1]) / 2;
                            const distance = Math.sqrt(
                              Math.pow(nextPoint[0] - point[0], 2) +
                                Math.pow(nextPoint[1] - point[1], 2)
                            );

                            return (
                              <Text
                                key={`measure-${idx}`}
                                x={midX}
                                y={midY - 15 / scale}
                                text={`${((distance * 0.5) / 12).toFixed(1)}ft`}
                                fontSize={12 / scale}
                                fill="#000"
                                fontStyle="bold"
                                padding={4 / scale}
                                align="center"
                                listening={false}
                              />
                            );
                          })}
                      </Group>
                    );
                  })}

                {/* Selection Bounding Box */}
                {selectedShape && getSelectedShapeBoundingBox() && (
                  <Line
                    points={[
                      getSelectedShapeBoundingBox().minX,
                      getSelectedShapeBoundingBox().minY,
                      getSelectedShapeBoundingBox().maxX,
                      getSelectedShapeBoundingBox().minY,
                      getSelectedShapeBoundingBox().maxX,
                      getSelectedShapeBoundingBox().maxY,
                      getSelectedShapeBoundingBox().minX,
                      getSelectedShapeBoundingBox().maxY,
                      getSelectedShapeBoundingBox().minX,
                      getSelectedShapeBoundingBox().minY,
                    ]}
                    stroke="#722ed1"
                    strokeWidth={1 / scale}
                    dash={[8 / scale, 4 / scale]}
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
          </div>

          {/* Status Bar */}
          <StatusBar
            shapes={shapes}
            selectedShape={selectedShape}
            selectedPoint={selectedPoint}
            toolMode={toolMode}
            gridSize={gridSize}
            moveIncrement={moveIncrement}
            history={history}
            historyIndex={historyIndex}
          />
        </Card>
      </div>
    </div>
  );
};

export default DxfEditor;
