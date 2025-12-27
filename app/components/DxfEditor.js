"use client";
import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";
import {
  Button,
  Slider,
  Card,
  message,
  ColorPicker,
  Divider,
  Space,
  Tooltip,
  Switch,
  Statistic,
  Alert,
} from "antd";
import {
  UndoOutlined,
  RedoOutlined,
  UploadOutlined,
  PlusOutlined,
  DragOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { produce } from "immer";

const initialShapes = [
  {
    id: 1,
    name: "PLAAT 1",
    file: "/PLAAT1.dxf",
  },
  {
    id: 2,
    name: "PLAAT 2",
    file: "/PLAAT2.dxf",
  },
  {
    id: 3,
    name: "PLAAT 3",
    file: "/PLAAT3.dxf",
  },
];

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
  const [color, setColor] = useState("#1890ff");
  const [lineWidth, setLineWidth] = useState(2);
  const [toolMode, setToolMode] = useState("select");
  const [availableDxfFiles] = useState(initialShapes);

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

  // Update History (Fixed)
  const updateHistory = (newShapes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newShapes)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Load DXF File from predefined list
  const loadPredefinedDxf = async (dxfFile) => {
    try {
      const response = await fetch(dxfFile.file);
      if (!response.ok) {
        message.error(`Failed to load ${dxfFile.name}`);
        return;
      }

      const text = await response.text();
      const lines = text.split("\n");
      const parsedShapes = parseDxfContent(lines);

      if (parsedShapes.length > 0) {
        const newShapes = parsedShapes.map((shape, idx) => ({
          ...shape,
          id: `dxf-${Date.now()}-${idx}`,
          color: getColorByIndex(idx),
          strokeWidth: lineWidth,
          visible: true,
          locked: false,
          name: `${dxfFile.name} - Shape ${idx + 1}`,
        }));

        setShapes(newShapes);
        updateHistory(newShapes);
        calculateMeasurements(newShapes);
        message.success(
          `Loaded ${parsedShapes.length} shapes from ${dxfFile.name}`
        );
      } else {
        message.warning("No shapes found in DXF file");
      }
    } catch (error) {
      message.error("Error loading DXF file");
      console.error("DXF Load Error:", error);
    }
  };

  // DXF File Upload Handler (Fixed)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".dxf")) {
      message.error("Please upload a .dxf file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n");
        const parsedShapes = parseDxfContent(lines);

        if (parsedShapes.length > 0) {
          const newShapes = parsedShapes.map((shape, idx) => ({
            ...shape,
            id: `dxf-${Date.now()}-${idx}`,
            color: getColorByIndex(idx),
            strokeWidth: lineWidth,
            visible: true,
            locked: false,
            name: `Uploaded Shape ${idx + 1}`,
          }));

          setShapes(newShapes);
          updateHistory(newShapes);
          calculateMeasurements(newShapes);
          message.success(`Loaded ${parsedShapes.length} shapes from DXF file`);
        } else {
          message.warning("No shapes found in DXF file");
        }
      } catch (error) {
        message.error("Error parsing DXF file");
        console.error("DXF Parse Error:", error);
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = null;
  };

  // Enhanced DXF parser (Fixed)
  const parseDxfContent = (lines) => {
    const shapes = [];
    let currentShape = null;
    let inVertex = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect entity start
      if (line === "LINE" || line === "LWPOLYLINE" || line === "POLYLINE") {
        if (currentShape && currentShape.points.length > 0) {
          shapes.push(currentShape);
        }
        currentShape = {
          type: line === "LINE" ? "line" : "polyline",
          points: [],
          closed: line !== "LINE",
        };
      }

      // Parse coordinates
      if (currentShape) {
        if (line === "10" || line === "20") {
          const x = parseFloat(lines[i + 1]) || 0;
          const y = parseFloat(lines[i + 2]) || 0;

          // Scale coordinates to fit canvas (assuming DXF is in mm, scale to pixels)
          currentShape.points.push([x * 0.5 + 200, y * 0.5 + 200]);
          i += 2;
        }

        // For LINE entities, also check for endpoint
        if (currentShape.type === "line" && line === "11") {
          const x = parseFloat(lines[i + 1]) || 0;
          const y = parseFloat(lines[i + 2]) || 0;
          currentShape.points.push([x * 0.5 + 200, y * 0.5 + 200]);
          i += 2;
        }
      }
    }

    if (currentShape && currentShape.points.length > 0) {
      shapes.push(currentShape);
    }

    return shapes.filter((s) => s.points.length >= 2);
  };

  const getColorByIndex = (idx) => {
    const colors = [
      "#1890ff",
      "#52c41a",
      "#722ed1",
      "#fa8c16",
      "#f5222d",
      "#13c2c2",
      "#eb2f96",
    ];
    return colors[idx % colors.length];
  };

  // Scale/Resize Shape (Fixed)
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
    message.success(`Shape scaled by ${scaleFactor}x`);
  };

  // Drag Points (Fixed)
  const handlePointDrag = (shapeIndex, pointIndex, newPos) => {
    const updatedShapes = produce(shapes, (draft) => {
      let { x, y } = newPos;

      if (snapToGrid) {
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
      }

      draft[shapeIndex].points[pointIndex] = [x, y];
    });
    setShapes(updatedShapes);
  };

  const handlePointDragEnd = () => {
    updateHistory(shapes);
    calculateMeasurements(shapes);
  };

  // Add New Point to Line (Fixed)
  const addNewPoint = (shapeIndex, segmentIndex, position) => {
    const updatedShapes = produce(shapes, (draft) => {
      const shape = draft[shapeIndex];
      let { x, y } = position;

      if (snapToGrid) {
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
      }

      shape.points.splice(segmentIndex + 1, 0, [x, y]);
    });
    updateShapes(updatedShapes);
    message.success("New point added");
  };

  // Delete Point (Fixed)
  const deletePoint = (shapeIndex, pointIndex) => {
    const shape = shapes[shapeIndex];

    if (shape.points.length <= 2) {
      message.warning("Cannot delete point - minimum 2 points required");
      return;
    }

    const updatedShapes = produce(shapes, (draft) => {
      draft[shapeIndex].points.splice(pointIndex, 1);
    });
    updateShapes(updatedShapes);
    message.success("Point deleted");
  };

  // Undo/Redo System (Fixed)
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setShapes(prevState);
      setHistoryIndex(historyIndex - 1);
      calculateMeasurements(prevState);
      message.success("Undo successful");
    } else {
      message.warning("Nothing to undo");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setShapes(nextState);
      setHistoryIndex(historyIndex + 1);
      calculateMeasurements(nextState);
      message.success("Redo successful");
    } else {
      message.warning("Nothing to redo");
    }
  };

  // Calculate Area and Perimeter (Fixed)
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

    // Convert to square feet (assuming 1 unit = 1 inch)
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

  // Update Shapes Helper (Fixed)
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

  // Export as Image (Fixed)
  const exportAsImage = () => {
    if (stageRef.current) {
      const stage = stageRef.current.getStage();
      const dataURL = stage.toDataURL({ pixelRatio: 2 });

      const link = document.createElement("a");
      link.download = `dxf-editor-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Exported as PNG image");
    }
  };

  // Delete Selected Shape (Fixed)
  const deleteSelectedShape = () => {
    if (selectedShape) {
      const updatedShapes = shapes.filter(
        (shape) => shape.id !== selectedShape
      );
      updateShapes(updatedShapes);
      setSelectedShape(null);
      message.success("Shape deleted");
    } else {
      message.warning("Please select a shape first");
    }
  };

  // Duplicate Shape (Fixed)
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
        message.success("Shape duplicated");
      }
    } else {
      message.warning("Please select a shape first");
    }
  };

  // Toggle Shape Visibility (Fixed)
  const toggleShapeVisibility = (shapeId) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, visible: !shape.visible } : shape
    );
    updateShapes(updatedShapes);
  };

  // Toggle Shape Lock (Fixed)
  const toggleShapeLock = (shapeId) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, locked: !shape.locked } : shape
    );
    updateShapes(updatedShapes);
    message.success(
      shapes.find((s) => s.id === shapeId)?.locked
        ? "Shape unlocked"
        : "Shape locked"
    );
  };

  // Change Shape Color (Fixed)
  const changeShapeColor = (shapeId, newColor) => {
    const updatedShapes = shapes.map((shape) =>
      shape.id === shapeId ? { ...shape, color: newColor } : shape
    );
    updateShapes(updatedShapes);
  };

  // Grid Generator (Fixed)
  const renderGrid = () => {
    const gridSize = 20;
    const gridLines = [];
    const width = stageSize.width / scale;
    const height = stageSize.height / scale;

    for (let i = 0; i < width; i += gridSize) {
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

    for (let i = 0; i < height; i += gridSize) {
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 bg-gray-50 min-h-screen">
      {/* Left Sidebar - Tools */}
      <div className="lg:w-80 space-y-4">
        {/* File Operations */}
        <Card title="📁 File Operations" size="small" className="shadow-md">
          <Space orientation="vertical" className="w-full" size="small">
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              block
              size="large"
            >
              Upload DXF File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".dxf"
              className="hidden"
            />

            <Divider style={{ margin: "8px 0" }}>or load predefined</Divider>

            {availableDxfFiles.map((dxfFile) => (
              <Button
                key={dxfFile.id}
                onClick={() => loadPredefinedDxf(dxfFile)}
                block
                icon={<UploadOutlined />}
              >
                {dxfFile.name}
              </Button>
            ))}

            <Divider style={{ margin: "8px 0" }} />

            <Button
              icon={<DownloadOutlined />}
              onClick={exportAsImage}
              block
              size="large"
            >
              Export as PNG
            </Button>
          </Space>
        </Card>

        {/* Editing Tools */}
        <Card title="🛠️ Editing Tools" size="small" className="shadow-md">
          <Space orientation="vertical" className="w-full" size="small">
            <div className="grid grid-cols-3 gap-2">
              <Tooltip title="Select & Move">
                <Button
                  type={toolMode === "select" ? "primary" : "default"}
                  icon={<DragOutlined />}
                  onClick={() => setToolMode("select")}
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
          </Space>
        </Card>

        {/* Shape Properties */}
        <Card title="🎨 Shape Properties" size="small" className="shadow-md">
          {selectedShape ? (
            <div className="space-y-3">
              <Alert
                title={
                  shapes.find((s) => s.id === selectedShape)?.name || "Shape"
                }
                type="info"
                showIcon
              />

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <ColorPicker
                  value={
                    shapes.find((s) => s.id === selectedShape)?.color || color
                  }
                  onChange={(_, hex) => changeShapeColor(selectedShape, hex)}
                  showText
                  style={{ width: "100%" }}
                />
              </div>

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
          ) : (
            <Alert
              title="No shape selected"
              description="Click on a shape to edit"
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* Settings */}
        <Card title="⚙️ Settings" size="small" className="shadow-md">
          <Space orientation="vertical" className="w-full" size="small">
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
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip title="Undo (Ctrl+Z)">
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  size="large"
                />
              </Tooltip>
              <Tooltip title="Redo (Ctrl+Y)">
                <Button
                  icon={<RedoOutlined />}
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  size="large"
                />
              </Tooltip>

              <Divider orientation="vertical" />

              <Tooltip title="Zoom In">
                <Button
                  icon={<ZoomInOutlined />}
                  onClick={() => setScale(Math.min(3, scale * 1.2))}
                  size="large"
                />
              </Tooltip>
              <Tooltip title="Zoom Out">
                <Button
                  icon={<ZoomOutOutlined />}
                  onClick={() => setScale(Math.max(0.1, scale / 1.2))}
                  size="large"
                />
              </Tooltip>
              <Button
                onClick={() => setScale(1)}
                size="large"
                disabled={scale === 1}
              >
                Reset Zoom
              </Button>
              <span className="text-sm font-medium px-2 py-1 bg-white rounded">
                {Math.round(scale * 100)}%
              </span>

              <Divider orientation="vertical" />

              <span className="text-sm font-medium px-3 py-1 bg-blue-100 rounded">
                {shapes.filter((s) => s.visible).length} / {shapes.length}{" "}
                shapes
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Statistic
                title="Total Area"
                value={totalArea.toFixed(2)}
                suffix="sq ft"
                style={{ fontSize: "16px", color: "#1890ff" }}
              />
              <Statistic
                title="Perimeter"
                value={totalPerimeter.toFixed(2)}
                suffix="ft"
                style={{ fontSize: "16px", color: "#52c41a" }}
              />
            </div>
          </div>

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
                          shape.points.map((point, pointIndex) => (
                            <Circle
                              key={`${shape.id}-point-${pointIndex}`}
                              x={point[0]}
                              y={point[1]}
                              radius={8 / scale}
                              fill="#722ed1"
                              stroke="#ffffff"
                              strokeWidth={2 / scale}
                              draggable
                              onDragMove={(e) => {
                                handlePointDrag(
                                  shapeIndex,
                                  pointIndex,
                                  e.target.position()
                                );
                              }}
                              onDragEnd={handlePointDragEnd}
                              onMouseEnter={(e) => {
                                const container = e.target
                                  .getStage()
                                  .container();
                                container.style.cursor = "move";
                                setSelectedPoint({ shapeIndex, pointIndex });
                              }}
                              onMouseLeave={(e) => {
                                const container = e.target
                                  .getStage()
                                  .container();
                                container.style.cursor = "default";
                                setSelectedPoint(null);
                              }}
                              onClick={(e) => {
                                if (toolMode === "delete-point") {
                                  e.cancelBubble = true;
                                  deletePoint(shapeIndex, pointIndex);
                                }
                              }}
                            />
                          ))}

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
                                text={`${(distance / 12).toFixed(1)}ft`}
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
          <div className="mt-3 flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
            <div className="font-medium">
              {selectedPoint ? (
                <span className="text-purple-600">
                  📍 Point: (
                  {Math.round(
                    shapes[selectedPoint.shapeIndex]?.points[
                      selectedPoint.pointIndex
                    ][0]
                  )}
                  ,
                  {Math.round(
                    shapes[selectedPoint.shapeIndex]?.points[
                      selectedPoint.pointIndex
                    ][1]
                  )}
                  )
                </span>
              ) : selectedShape ? (
                <span className="text-blue-600">
                  ✓ Selected: {shapes.find((s) => s.id === selectedShape)?.name}
                </span>
              ) : (
                <span className="text-gray-500">
                  ℹ️ Mode:{" "}
                  {toolMode === "select"
                    ? "Select & Move"
                    : toolMode === "add-point"
                    ? "Add Point"
                    : "Delete Point"}
                </span>
              )}
            </div>
            <div className="flex gap-4 text-gray-600">
              <span>
                📊 Total Points:{" "}
                {shapes.reduce((sum, shape) => sum + shape.points.length, 0)}
              </span>
              <span>
                📜 History: {historyIndex + 1} / {history.length}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DxfEditor;
