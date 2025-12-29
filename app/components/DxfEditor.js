"use client";
import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Group, Arc } from "react-konva";
import {
  Button,
  Card,
  Divider,
  Space,
  Tooltip,
  Alert,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  DragOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  AimOutlined,
  RadiusSettingOutlined,
} from "@ant-design/icons";
import { produce } from "immer";
import FileOperations from "./FileOperations";
import { showToast } from "nextjs-toast-notify";
import StatusBar from "./StatusBar";
import MainToolbar from "./MainToolbar";
import Settings from "./Settings";
import ShapeProperties from "./ShapeProperties";

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

  // Round by Drag State
  const [roundByDragActive, setRoundByDragActive] = useState(false);
  const [roundingPoints, setRoundingPoints] = useState([]); // [{shapeIndex, pointIndex}, ...]
  const [isDraggingMidpoint, setIsDraggingMidpoint] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // Distance dragged from midpoint
  const [previewArc, setPreviewArc] = useState(null); // Preview arc while dragging

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

  // Clear selected point when tool mode changes (except select-point and round-by-drag)
  useEffect(() => {
    if (toolMode !== "select-point" && toolMode !== "round-by-drag") {
      setSelectedPoint(null);
    }
    // Reset rounding state when switching away from round-by-drag
    if (toolMode !== "round-by-drag") {
      setRoundByDragActive(false);
      setRoundingPoints([]);
      setIsDraggingMidpoint(false);
      setDragOffset(0);
      setPreviewArc(null);
    }
  }, [toolMode]);

  // Toggle Round by Drag mode
  const toggleRoundByDrag = () => {
    if (roundByDragActive) {
      // Deactivate
      setRoundByDragActive(false);
      setRoundingPoints([]);
      setIsDraggingMidpoint(false);
      setDragOffset(0);
      setPreviewArc(null);
      setToolMode("select");
    } else {
      // Activate
      setRoundByDragActive(true);
      setToolMode("round-by-drag");
      setRoundingPoints([]);
      setSelectedPoint(null);
    }
  };

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
    setRoundingPoints([]);
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

  // ============== ROUND BY DRAG FUNCTIONS ==============

  // Get midpoint between two points
  const getMidpoint = (p1, p2) => {
    return {
      x: (p1[0] + p2[0]) / 2,
      y: (p1[1] + p2[1]) / 2,
    };
  };

  // Get distance between two points
  const getDistance = (p1, p2) => {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get perpendicular direction (normalized)
  const getPerpendicularDirection = (p1, p2) => {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    // Perpendicular vector (rotated 90 degrees)
    return {
      x: -dy / length,
      y: dx / length,
    };
  };

  // Calculate arc points for preview and final shape
  const calculateArcPoints = (p1, p2, dragDistance, numSegments = 20) => {
    if (Math.abs(dragDistance) < 1) {
      return [p1, p2]; // No arc, just straight line
    }

    const midpoint = getMidpoint(p1, p2);
    const d = getDistance(p1, p2);
    const h = Math.abs(dragDistance);

    // Limit h to prevent invalid calculations
    const maxH = d / 2 - 1;
    const clampedH = Math.min(h, maxH);

    if (clampedH < 1) {
      return [p1, p2];
    }

    // Calculate radius using the sagitta formula
    // r = (h/2) + (d²)/(8h)
    const radius = clampedH / 2 + (d * d) / (8 * clampedH);

    // Get perpendicular direction
    const perp = getPerpendicularDirection(p1, p2);

    // Determine arc direction based on drag direction
    const direction = dragDistance > 0 ? 1 : -1;

    // Center of the arc
    const centerX = midpoint.x + perp.x * (radius - clampedH) * direction;
    const centerY = midpoint.y + perp.y * (radius - clampedH) * direction;

    // Calculate start and end angles
    const startAngle = Math.atan2(p1[1] - centerY, p1[0] - centerX);
    const endAngle = Math.atan2(p2[1] - centerY, p2[0] - centerX);

    // Generate arc points
    const arcPoints = [];

    // Determine the correct sweep direction
    let angleDiff = endAngle - startAngle;

    // Normalize angle difference
    if (direction > 0) {
      // Outward arc - use shorter path
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    } else {
      // Inward arc - use shorter path
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    }

    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const angle = startAngle + angleDiff * t;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      arcPoints.push([x, y]);
    }

    return arcPoints;
  };

  // Handle point click in round-by-drag mode
  const handleRoundingPointClick = (e, shapeIndex, pointIndex) => {
    e.cancelBubble = true;

    if (!roundByDragActive) return;

    const shape = shapes[shapeIndex];
    if (!shape) return;

    // Check if this point is already selected
    const existingIndex = roundingPoints.findIndex(
      (rp) => rp.shapeIndex === shapeIndex && rp.pointIndex === pointIndex
    );

    if (existingIndex !== -1) {
      // Deselect this point
      const newPoints = [...roundingPoints];
      newPoints.splice(existingIndex, 1);
      setRoundingPoints(newPoints);
      return;
    }

    // Check if we're selecting from the same shape
    if (
      roundingPoints.length > 0 &&
      roundingPoints[0].shapeIndex !== shapeIndex
    ) {
      showToast.warning("Please select points from the same shape", {
        duration: 2000,
      });
      return;
    }

    // Add this point
    if (roundingPoints.length < 2) {
      const newPoints = [...roundingPoints, { shapeIndex, pointIndex }];
      setRoundingPoints(newPoints);

      if (newPoints.length === 2) {
        // Check if points are adjacent
        const idx1 = newPoints[0].pointIndex;
        const idx2 = newPoints[1].pointIndex;
        const numPoints = shape.points.length;

        const isAdjacent =
          Math.abs(idx1 - idx2) === 1 ||
          (shape.closed &&
            ((idx1 === 0 && idx2 === numPoints - 1) ||
              (idx2 === 0 && idx1 === numPoints - 1)));

        if (!isAdjacent) {
          showToast.warning("Please select two adjacent points", {
            duration: 2000,
          });
          setRoundingPoints([]);
          return;
        }

        showToast.info("Drag the midpoint to create a round", {
          duration: 3000,
        });
      }
    }
  };

  // Handle midpoint drag start
  const handleMidpointDragStart = (e) => {
    e.cancelBubble = true;
    setIsDraggingMidpoint(true);
    setDragOffset(0);
  };

  // Handle midpoint drag
  const handleMidpointDrag = (e) => {
    if (!isDraggingMidpoint || roundingPoints.length !== 2) return;

    const shape = shapes[roundingPoints[0].shapeIndex];
    const p1 = shape.points[roundingPoints[0].pointIndex];
    const p2 = shape.points[roundingPoints[1].pointIndex];
    const midpoint = getMidpoint(p1, p2);
    const perp = getPerpendicularDirection(p1, p2);

    const pos = e.target.position();

    // Calculate drag distance along perpendicular
    const dx = pos.x - midpoint.x;
    const dy = pos.y - midpoint.y;
    const projectedDistance = dx * perp.x + dy * perp.y;

    setDragOffset(projectedDistance);

    // Calculate preview arc
    const arcPoints = calculateArcPoints(p1, p2, projectedDistance);
    setPreviewArc({
      points: arcPoints,
      shapeIndex: roundingPoints[0].shapeIndex,
    });
  };

  // Handle midpoint drag end - apply the rounding
  const handleMidpointDragEnd = () => {
    if (
      !isDraggingMidpoint ||
      roundingPoints.length !== 2 ||
      Math.abs(dragOffset) < 5
    ) {
      setIsDraggingMidpoint(false);
      setDragOffset(0);
      setPreviewArc(null);
      return;
    }

    const shape = shapes[roundingPoints[0].shapeIndex];
    const p1 = shape.points[roundingPoints[0].pointIndex];
    const p2 = shape.points[roundingPoints[1].pointIndex];

    // Generate arc points
    const arcPoints = calculateArcPoints(p1, p2, dragOffset, 16);

    // Update the shape by replacing the segment with arc points
    const updatedShapes = produce(shapes, (draft) => {
      const shapeToUpdate = draft[roundingPoints[0].shapeIndex];
      const idx1 = roundingPoints[0].pointIndex;
      const idx2 = roundingPoints[1].pointIndex;

      // Determine which index comes first
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);

      // Handle edge case for closed shapes where first and last points are selected
      if (
        shape.closed &&
        minIdx === 0 &&
        maxIdx === shapeToUpdate.points.length - 1
      ) {
        // Arc between last and first point
        const newPoints = [
          ...arcPoints.slice(1, -1), // Arc points (excluding endpoints)
          ...shapeToUpdate.points.slice(1, -1), // Middle points
        ];
        shapeToUpdate.points =
          newPoints.length >= 3 ? newPoints : shapeToUpdate.points;
      } else {
        // Normal case - insert arc points between the two selected points
        const newPoints = [
          ...shapeToUpdate.points.slice(0, minIdx + 1),
          ...arcPoints.slice(1, -1), // Arc points (excluding endpoints that match existing points)
          ...shapeToUpdate.points.slice(maxIdx),
        ];
        shapeToUpdate.points = newPoints;
      }
    });

    updateShapes(updatedShapes);
    showToast.success("Round applied successfully!", { duration: 2000 });

    // Reset state
    setIsDraggingMidpoint(false);
    setDragOffset(0);
    setPreviewArc(null);
    setRoundingPoints([]);
  };

  // Render midpoint for rounding
  const renderRoundingMidpoint = () => {
    if (!roundByDragActive || roundingPoints.length !== 2) return null;

    const shape = shapes[roundingPoints[0].shapeIndex];
    if (!shape) return null;

    const p1 = shape.points[roundingPoints[0].pointIndex];
    const p2 = shape.points[roundingPoints[1].pointIndex];
    const midpoint = getMidpoint(p1, p2);

    return (
      <Group>
        {/* Connection line between selected points */}
        <Line
          points={[p1[0], p1[1], p2[0], p2[1]]}
          stroke="#ff4d4f"
          strokeWidth={2 / scale}
          dash={[5 / scale, 5 / scale]}
          listening={false}
        />

        {/* Guide line showing drag direction */}
        {isDraggingMidpoint && (
          <Line
            points={[
              midpoint.x,
              midpoint.y,
              midpoint.x + getPerpendicularDirection(p1, p2).x * dragOffset,
              midpoint.y + getPerpendicularDirection(p1, p2).y * dragOffset,
            ]}
            stroke="#52c41a"
            strokeWidth={2 / scale}
            listening={false}
          />
        )}

        {/* Midpoint handle */}
        <Circle
          x={
            isDraggingMidpoint
              ? midpoint.x + getPerpendicularDirection(p1, p2).x * dragOffset
              : midpoint.x
          }
          y={
            isDraggingMidpoint
              ? midpoint.y + getPerpendicularDirection(p1, p2).y * dragOffset
              : midpoint.y
          }
          radius={12 / scale}
          fill="#52c41a"
          stroke="#ffffff"
          strokeWidth={3 / scale}
          draggable={true}
          onDragStart={handleMidpointDragStart}
          onDragMove={handleMidpointDrag}
          onDragEnd={handleMidpointDragEnd}
          onMouseEnter={(e) => {
            const container = e.target.getStage().container();
            container.style.cursor = "ns-resize";
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage().container();
            container.style.cursor = "default";
          }}
        />

        {/* Midpoint label */}
        <Text
          x={midpoint.x + 15 / scale}
          y={midpoint.y - 10 / scale}
          text="MiddlePoint"
          fontSize={12 / scale}
          fill="#52c41a"
          fontStyle="bold"
          listening={false}
        />

        {/* Drag offset indicator */}
        {isDraggingMidpoint && Math.abs(dragOffset) > 5 && (
          <Text
            x={
              midpoint.x +
              getPerpendicularDirection(p1, p2).x * dragOffset +
              15 / scale
            }
            y={
              midpoint.y +
              getPerpendicularDirection(p1, p2).y * dragOffset -
              10 / scale
            }
            text={`${dragOffset > 0 ? "+" : ""}${(dragOffset / 12).toFixed(
              2
            )}"`}
            fontSize={11 / scale}
            fill="#722ed1"
            fontStyle="bold"
            listening={false}
          />
        )}
      </Group>
    );
  };

  // Render preview arc
  const renderPreviewArc = () => {
    if (!previewArc || previewArc.points.length < 2) return null;
    const flatPoints = previewArc.points.flat();
    return (
      <Line
        points={flatPoints}
        stroke="#52c41a"
        strokeWidth={3 / scale}
        lineCap="round"
        lineJoin="round"
        dash={[8 / scale, 4 / scale]}
        listening={false}
      />
    );
  };

  // Handle point click based on tool mode
  const handlePointClick = (e, shapeIndex, pointIndex) => {
    e.cancelBubble = true;

    if (toolMode === "round-by-drag") {
      handleRoundingPointClick(e, shapeIndex, pointIndex);
    } else if (toolMode === "delete-point") {
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

  // Check if a point is selected for rounding
  const isPointSelectedForRounding = (shapeIndex, pointIndex) => {
    return roundingPoints.some(
      (rp) => rp.shapeIndex === shapeIndex && rp.pointIndex === pointIndex
    );
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

            {/* Round by Drag Button */}
            <Divider style={{ margin: "8px 0" }}>Rounding</Divider>
            <Tooltip title="Round by Drag - Select 2 adjacent points then drag midpoint">
              <Button
                type={roundByDragActive ? "primary" : "default"}
                icon={<RadiusSettingOutlined />}
                onClick={toggleRoundByDrag}
                block
                style={{
                  height: 40,
                  backgroundColor: roundByDragActive ? "#1890ff" : undefined,
                  borderColor: roundByDragActive ? "#1890ff" : undefined,
                }}
              >
                🔵 Round by Drag
              </Button>
            </Tooltip>

            <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-100 rounded">
              {toolMode === "select" &&
                "🖱️ Click shape to select, drag points to move"}
              {toolMode === "select-point" &&
                "🎯 Click point to select/deselect for precision editing"}
              {toolMode === "add-point" &&
                "➕ Click on line segment to add new point"}
              {toolMode === "delete-point" && "🗑️ Click point to delete"}
              {toolMode === "round-by-drag" && (
                <span className="text-blue-600 font-medium">
                  🔵 Select 2 adjacent points, then drag the midpoint up/down to
                  round
                </span>
              )}
            </div>

            {/* Rounding Status */}
            {roundByDragActive && (
              <Alert
                type={roundingPoints.length === 2 ? "success" : "info"}
                title={
                  roundingPoints.length === 0
                    ? "Step 1: Click first point"
                    : roundingPoints.length === 1
                    ? "Step 2: Click second adjacent point"
                    : "Step 3: Drag the green midpoint up/down"
                }
                showIcon
                style={{ marginTop: 8 }}
              />
            )}

            {roundByDragActive && roundingPoints.length > 0 && (
              <Button size="small" onClick={() => setRoundingPoints([])} block>
                Clear Selection
              </Button>
            )}
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

              <div className="grid grid-cols-2 gap-1 mx-[-5px]">
                <Button
                  onClick={() => setSelectedPoint(null)}
                  block
                  size="small"
                  className="!p-3"
                >
                  Deselect Point
                </Button>
                <Button
                  danger
                  onClick={() => {
                    deletePoint(
                      selectedPoint.shapeIndex,
                      selectedPoint.pointIndex
                    );
                    setSelectedPoint(null);
                  }}
                  block
                  size="small"
                  className="!p-3"
                >
                  Delete Point
                </Button>
              </div>
            </Space>
          </Card>
        )}

        {/* Shape Properties */}
        {selectedShape && (
          <ShapeProperties
            shapes={shapes}
            selectedShape={selectedShape}
            updateShapes={updateShapes}
            setSelectedShape={setSelectedShape}
            setSelectedPoint={setSelectedPoint}
          />
        )}

        {/* Settings */}
        <Settings
          gridSize={gridSize}
          setGridSize={setGridSize}
          gridVisible={gridVisible}
          setGridVisible={setGridVisible}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          showMeasurements={showMeasurements}
          setShowMeasurements={setShowMeasurements}
        />
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
                        {(isSelected || roundByDragActive) &&
                          !isLocked &&
                          shape.points.map((point, pointIndex) => {
                            const isPointSelected =
                              selectedPoint?.shapeIndex === shapeIndex &&
                              selectedPoint?.pointIndex === pointIndex;

                            const isSelectedForRounding =
                              isPointSelectedForRounding(
                                shapeIndex,
                                pointIndex
                              );

                            // Determine if point should be draggable (only in select mode)
                            const isDraggable = toolMode === "select";

                            // Determine point color
                            let pointColor = "#722ed1"; // Default purple
                            if (isSelectedForRounding) {
                              pointColor = "#ff4d4f"; // Red for rounding selection
                            } else if (isPointSelected) {
                              pointColor = "#f5222d"; // Red for precision selection
                            }

                            return (
                              <Circle
                                key={`${shape.id}-point-${pointIndex}`}
                                x={point[0]}
                                y={point[1]}
                                radius={
                                  isPointSelected || isSelectedForRounding
                                    ? 10 / scale
                                    : 8 / scale
                                }
                                fill={pointColor}
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
                                  } else if (
                                    toolMode === "select-point" ||
                                    toolMode === "round-by-drag"
                                  ) {
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

                {/* Preview Arc for Rounding */}
                {renderPreviewArc()}

                {/* Rounding Midpoint */}
                {renderRoundingMidpoint()}

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
