"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Circle, Text, Group, Arc } from "react-konva";
import {
  Button,
  Card,
  Divider,
  Space,
  Tooltip,
  Alert,
  InputNumber,
  Modal,
  Select,
  Input,
  Upload,
  message,
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
  BorderOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { produce } from "immer";
import FileOperations from "./FileOperations";
import StatusBar from "./StatusBar";
import MainToolbar from "./MainToolbar";
import Settings from "./Settings";
import ShapeProperties from "./ShapeProperties";
import ShapeTemplates from "./ShapeTemplates";
import CornerSettings from "./CornerSettings";
import DrillingHoles from "./DrillingHoles";
import MaterialSelector from "./MaterialSelector";
import PricingPanel from "./PricingPanel";
import DimensionInput from "./DimensionInput";
import ValidationPanel from "./ValidationPanel";

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
  const [unit, setUnit] = useState("mm"); // mm or cm

  // Shape dragging state
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);

  // Drilling Holes State
  const [drillingHoles, setDrillingHoles] = useState([]);
  const [isPlacingHole, setIsPlacingHole] = useState(false);

  // Corner Settings State
  const [cornerSettings, setCornerSettings] = useState({}); // { pointIndex: { type: 'sharp' | 'radius', radius: 5 } }

  // Material & Pricing State
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedThickness, setSelectedThickness] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [specialColorRequest, setSpecialColorRequest] = useState("");
  const [specialColorFile, setSpecialColorFile] = useState(null);

  // Round by Drag State
  const [roundByDragActive, setRoundByDragActive] = useState(false);
  const [roundingPoints, setRoundingPoints] = useState([]);
  const [isDraggingMidpoint, setIsDraggingMidpoint] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [previewArc, setPreviewArc] = useState(null);

  // Validation State
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Current Step (for multi-step form)
  const [currentStep, setCurrentStep] = useState(1);

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
          [192, 227],
          [213, 211],
          [235, 197],
          [258, 184],
          [283, 173],
          [308, 165],
          [334, 159],
          [360, 155],
          [387, 154],
          [414, 155],
          [440, 159],
          [466, 165],
          [491, 173],
          [516, 184],
          [539, 197],
          [561, 211],
          [582, 228],
          [582, 582],
          [192, 582],
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

    // Initialize corner settings
    const initialCornerSettings = {};
    sampleShapes[0].points.forEach((_, idx) => {
      initialCornerSettings[idx] = { type: "sharp", radius: 0 };
    });
    setCornerSettings(initialCornerSettings);
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

  // Clear selected point when tool mode changes
  useEffect(() => {
    if (toolMode !== "select-point" && toolMode !== "round-by-drag") {
      setSelectedPoint(null);
    }
    if (toolMode !== "round-by-drag") {
      setRoundByDragActive(false);
      setRoundingPoints([]);
      setIsDraggingMidpoint(false);
      setDragOffset(0);
      setPreviewArc(null);
    }
    if (toolMode !== "place-hole") {
      setIsPlacingHole(false);
    }
  }, [toolMode]);

  // Toggle Round by Drag mode
  const toggleRoundByDrag = () => {
    if (roundByDragActive) {
      setRoundByDragActive(false);
      setRoundingPoints([]);
      setIsDraggingMidpoint(false);
      setDragOffset(0);
      setPreviewArc(null);
      setToolMode("select");
    } else {
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

  // Handler for when shapes are loaded
  const handleShapesLoaded = (newShapes) => {
    setShapes(newShapes);
    updateHistory(newShapes);
    calculateMeasurements(newShapes);
    setSelectedShape(null);
    setSelectedPoint(null);
    setRoundingPoints([]);
    setDrillingHoles([]);

    // Reset corner settings
    const initialCornerSettings = {};
    if (newShapes.length > 0) {
      newShapes[0].points.forEach((_, idx) => {
        initialCornerSettings[idx] = { type: "sharp", radius: 0 };
      });
    }
    setCornerSettings(initialCornerSettings);
  };

  // ============= NEW: Shape Dragging Functions =============

  const handleShapeMouseDown = (e, shapeId) => {
    if (toolMode !== "select" && toolMode !== "move-shape") return;

    e.cancelBubble = true;
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const relativePos = transform.point(pointerPos);

    setIsDraggingShape(true);
    setDragStartPos(relativePos);
    setSelectedShape(shapeId);
  };

  const handleShapeMouseMove = (e) => {
    if (!isDraggingShape || !dragStartPos || !selectedShape) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const currentPos = transform.point(pointerPos);

    const dx = currentPos.x - dragStartPos.x;
    const dy = currentPos.y - dragStartPos.y;

    const updatedShapes = produce(shapes, (draft) => {
      const shapeIndex = draft.findIndex((s) => s.id === selectedShape);
      if (shapeIndex !== -1) {
        draft[shapeIndex].points = draft[shapeIndex].points.map((point) => [
          point[0] + dx,
          point[1] + dy,
        ]);
      }
    });

    setShapes(updatedShapes);
    setDragStartPos(currentPos);
  };

  const handleShapeMouseUp = () => {
    if (isDraggingShape) {
      setIsDraggingShape(false);
      setDragStartPos(null);
      updateHistory(shapes);
      calculateMeasurements(shapes);
    }
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

  // Move point with arrow keys
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

    // Update corner settings
    const newCornerSettings = { ...cornerSettings };
    newCornerSettings[Object.keys(newCornerSettings).length] = {
      type: "sharp",
      radius: 0,
    };
    setCornerSettings(newCornerSettings);

    message.success("New point added");
  };

  // Delete Point
  const deletePoint = (shapeIndex, pointIndex) => {
    const shape = shapes[shapeIndex];

    if (shape.points.length <= 3) {
      message.warning("Cannot delete point - minimum 3 points required");
      return;
    }

    const updatedShapes = produce(shapes, (draft) => {
      draft[shapeIndex].points.splice(pointIndex, 1);
    });
    updateShapes(updatedShapes);

    // Update corner settings
    const newCornerSettings = {};
    Object.keys(cornerSettings).forEach((key, idx) => {
      if (parseInt(key) !== pointIndex) {
        const newKey =
          parseInt(key) > pointIndex ? parseInt(key) - 1 : parseInt(key);
        newCornerSettings[newKey] = cornerSettings[key];
      }
    });
    setCornerSettings(newCornerSettings);

    message.success("Point deleted");
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

  // Auto-Square: Make all angles 90 degrees
  const autoSquare = () => {
    if (shapes.length === 0) {
      message.warning("No shapes to square");
      return;
    }

    const updatedShapes = produce(shapes, (draft) => {
      draft.forEach((shape) => {
        if (shape.points.length >= 4 && shape.closed) {
          const points = shape.points;
          const minX = Math.min(...points.map((p) => p[0]));
          const maxX = Math.max(...points.map((p) => p[0]));
          const minY = Math.min(...points.map((p) => p[1]));
          const maxY = Math.max(...points.map((p) => p[1]));

          // Create a rectangle from bounding box
          shape.points = [
            [minX, minY],
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY],
          ];
        }
      });
    });

    updateShapes(updatedShapes);
    message.success("Shape squared to 90° corners");
  };

  // Grid Generator
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

  const getMidpoint = (p1, p2) => {
    return {
      x: (p1[0] + p2[0]) / 2,
      y: (p1[1] + p2[1]) / 2,
    };
  };

  const getDistance = (p1, p2) => {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPerpendicularDirection = (p1, p2) => {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    return {
      x: -dy / length,
      y: dx / length,
    };
  };

  const calculateArcPoints = (p1, p2, dragDistance, numSegments = 20) => {
    if (Math.abs(dragDistance) < 1) {
      return [p1, p2];
    }

    const midpoint = getMidpoint(p1, p2);
    const d = getDistance(p1, p2);
    const h = Math.abs(dragDistance);

    const maxH = d / 2 - 1;
    const clampedH = Math.min(h, maxH);

    if (clampedH < 1) {
      return [p1, p2];
    }

    const radius = clampedH / 2 + (d * d) / (8 * clampedH);
    const perp = getPerpendicularDirection(p1, p2);
    const direction = dragDistance > 0 ? 1 : -1;

    const centerX = midpoint.x + perp.x * (radius - clampedH) * direction;
    const centerY = midpoint.y + perp.y * (radius - clampedH) * direction;

    const startAngle = Math.atan2(p1[1] - centerY, p1[0] - centerX);
    const endAngle = Math.atan2(p2[1] - centerY, p2[0] - centerX);

    const arcPoints = [];

    let angleDiff = endAngle - startAngle;

    if (direction > 0) {
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    } else {
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

  const handleRoundingPointClick = (e, shapeIndex, pointIndex) => {
    e.cancelBubble = true;

    if (!roundByDragActive) return;

    const shape = shapes[shapeIndex];
    if (!shape) return;

    const existingIndex = roundingPoints.findIndex(
      (rp) => rp.shapeIndex === shapeIndex && rp.pointIndex === pointIndex
    );

    if (existingIndex !== -1) {
      const newPoints = [...roundingPoints];
      newPoints.splice(existingIndex, 1);
      setRoundingPoints(newPoints);
      return;
    }

    if (
      roundingPoints.length > 0 &&
      roundingPoints[0].shapeIndex !== shapeIndex
    ) {
      message.warning("Please select points from the same shape");
      return;
    }

    if (roundingPoints.length < 2) {
      const newPoints = [...roundingPoints, { shapeIndex, pointIndex }];
      setRoundingPoints(newPoints);

      if (newPoints.length === 2) {
        const idx1 = newPoints[0].pointIndex;
        const idx2 = newPoints[1].pointIndex;
        const numPoints = shape.points.length;

        const isAdjacent =
          Math.abs(idx1 - idx2) === 1 ||
          (shape.closed &&
            ((idx1 === 0 && idx2 === numPoints - 1) ||
              (idx2 === 0 && idx1 === numPoints - 1)));

        if (!isAdjacent) {
          message.warning("Please select two adjacent points");
          setRoundingPoints([]);
          return;
        }

        message.info("Drag the midpoint to create a round");
      }
    }
  };

  const handleMidpointDragStart = (e) => {
    e.cancelBubble = true;
    setIsDraggingMidpoint(true);
    setDragOffset(0);
  };

  const handleMidpointDrag = (e) => {
    if (!isDraggingMidpoint || roundingPoints.length !== 2) return;

    const shape = shapes[roundingPoints[0].shapeIndex];
    const p1 = shape.points[roundingPoints[0].pointIndex];
    const p2 = shape.points[roundingPoints[1].pointIndex];
    const midpoint = getMidpoint(p1, p2);
    const perp = getPerpendicularDirection(p1, p2);

    const pos = e.target.position();

    const dx = pos.x - midpoint.x;
    const dy = pos.y - midpoint.y;
    const projectedDistance = dx * perp.x + dy * perp.y;

    setDragOffset(projectedDistance);

    const arcPoints = calculateArcPoints(p1, p2, projectedDistance);
    setPreviewArc({
      points: arcPoints,
      shapeIndex: roundingPoints[0].shapeIndex,
    });
  };

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

    const arcPoints = calculateArcPoints(p1, p2, dragOffset, 16);

    const updatedShapes = produce(shapes, (draft) => {
      const shapeToUpdate = draft[roundingPoints[0].shapeIndex];
      const idx1 = roundingPoints[0].pointIndex;
      const idx2 = roundingPoints[1].pointIndex;

      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);

      if (
        shape.closed &&
        minIdx === 0 &&
        maxIdx === shapeToUpdate.points.length - 1
      ) {
        const newPoints = [
          ...arcPoints.slice(1, -1),
          ...shapeToUpdate.points.slice(1, -1),
        ];
        shapeToUpdate.points =
          newPoints.length >= 3 ? newPoints : shapeToUpdate.points;
      } else {
        const newPoints = [
          ...shapeToUpdate.points.slice(0, minIdx + 1),
          ...arcPoints.slice(1, -1),
          ...shapeToUpdate.points.slice(maxIdx),
        ];
        shapeToUpdate.points = newPoints;
      }
    });

    updateShapes(updatedShapes);
    message.success("Round applied successfully!");

    setIsDraggingMidpoint(false);
    setDragOffset(0);
    setPreviewArc(null);
    setRoundingPoints([]);
  };

  const renderRoundingMidpoint = () => {
    if (!roundByDragActive || roundingPoints.length !== 2) return null;

    const shape = shapes[roundingPoints[0].shapeIndex];
    if (!shape) return null;

    const p1 = shape.points[roundingPoints[0].pointIndex];
    const p2 = shape.points[roundingPoints[1].pointIndex];
    const midpoint = getMidpoint(p1, p2);

    return (
      <Group>
        <Line
          points={[p1[0], p1[1], p2[0], p2[1]]}
          stroke="#ff4d4f"
          strokeWidth={2 / scale}
          dash={[5 / scale, 5 / scale]}
          listening={false}
        />

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

        <Text
          x={midpoint.x + 15 / scale}
          y={midpoint.y - 10 / scale}
          text="Drag to Round"
          fontSize={12 / scale}
          fill="#52c41a"
          fontStyle="bold"
          listening={false}
        />

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
      if (
        selectedPoint?.shapeIndex === shapeIndex &&
        selectedPoint?.pointIndex === pointIndex
      ) {
        setSelectedPoint(null);
      } else {
        setSelectedPoint({ shapeIndex, pointIndex });
      }
    }
  };

  const isPointSelectedForRounding = (shapeIndex, pointIndex) => {
    return roundingPoints.some(
      (rp) => rp.shapeIndex === shapeIndex && rp.pointIndex === pointIndex
    );
  };

  // Handle stage click for placing drilling holes
  const handleStageClick = (e) => {
    if (!isPlacingHole) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const relativePos = transform.point(pos);

    // Check if click is inside any shape
    const isInsideShape = shapes.some((shape) => {
      if (!shape.closed || !shape.visible) return false;
      return isPointInPolygon(relativePos, shape.points);
    });

    if (!isInsideShape) {
      message.warning("Drilling hole must be placed inside the shape");
      return;
    }

    const newHole = {
      id: `hole-${Date.now()}`,
      x: relativePos.x,
      y: relativePos.y,
      diameter: 6, // Fixed 6mm diameter
    };

    setDrillingHoles([...drillingHoles, newHole]);
    message.success("Drilling hole placed");

    if (drillingHoles.length >= 1) {
      setIsPlacingHole(false);
      setToolMode("select");
    }
  };

  // Point in polygon check
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];

      if (
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Render drilling holes
  const renderDrillingHoles = () => {
    return drillingHoles.map((hole) => (
      <Group key={hole.id}>
        <Circle
          x={hole.x}
          y={hole.y}
          radius={hole.diameter * 2}
          fill="#ff4d4f"
          stroke="#ffffff"
          strokeWidth={2 / scale}
          draggable={toolMode === "select"}
          onDragEnd={(e) => {
            const newPos = e.target.position();
            setDrillingHoles(
              drillingHoles.map((h) =>
                h.id === hole.id ? { ...h, x: newPos.x, y: newPos.y } : h
              )
            );
          }}
        />
        <Circle
          x={hole.x}
          y={hole.y}
          radius={hole.diameter}
          fill="#ffffff"
          listening={false}
        />
        <Text
          x={hole.x + 15 / scale}
          y={hole.y - 8 / scale}
          text={`⌀${hole.diameter}mm`}
          fontSize={10 / scale}
          fill="#ff4d4f"
          fontStyle="bold"
          listening={false}
        />
      </Group>
    ));
  };

  // Validation
  const validateOrder = () => {
    const errors = [];

    // Check if shapes exist
    if (shapes.length === 0) {
      errors.push("No shape defined. Please draw or upload a shape.");
    }

    // Check drilling holes (minimum 2 required)
    if (drillingHoles.length < 2) {
      errors.push(
        `Minimum 2 drilling holes required. Currently: ${drillingHoles.length}`
      );
    }

    // Check material selection
    if (!selectedMaterial) {
      errors.push("Please select a material.");
    }

    // Check thickness
    if (!selectedThickness) {
      errors.push("Please select a thickness.");
    }

    // Check color
    if (!selectedColor && !specialColorRequest) {
      errors.push("Please select a color or request a special color.");
    }

    // Check for invalid corners (radius intersection)
    const shape = shapes[0];
    if (shape) {
      for (let i = 0; i < shape.points.length; i++) {
        const corner = cornerSettings[i];
        if (corner && corner.type === "radius" && corner.radius > 0) {
          const prevIdx = (i - 1 + shape.points.length) % shape.points.length;
          const nextIdx = (i + 1) % shape.points.length;

          const distPrev = getDistance(shape.points[i], shape.points[prevIdx]);
          const distNext = getDistance(shape.points[i], shape.points[nextIdx]);

          if (
            corner.radius * 12 > distPrev / 2 ||
            corner.radius * 12 > distNext / 2
          ) {
            errors.push(
              `Corner ${i + 1} radius is too large for the adjacent edges.`
            );
          }
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && shapes.length === 0) {
      message.warning("Please draw or upload a shape first");
      return;
    }
    if (currentStep === 2 && drillingHoles.length < 2) {
      message.warning("Please add at least 2 drilling holes");
      return;
    }
    if (currentStep === 3 && (!selectedMaterial || !selectedThickness)) {
      message.warning("Please select material and thickness");
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final validation
      if (validateOrder()) {
        setShowValidationModal(true);
      } else {
        message.error("Please fix validation errors before submitting");
      }
    }
  };

  // Export order data
  const exportOrderData = () => {
    const orderData = {
      shapes: shapes.map((s) => ({
        points: s.points,
        closed: s.closed,
      })),
      cornerSettings,
      drillingHoles: drillingHoles.map((h) => ({
        x: h.x,
        y: h.y,
        diameter: h.diameter,
      })),
      material: selectedMaterial,
      thickness: selectedThickness,
      color: selectedColor,
      specialColorRequest,
      totalArea,
      totalPerimeter,
      unit,
    };

    console.log("Order Data:", orderData);
    return orderData;
  };

  return (
    <div className="gap-6 p-4 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-4 space-y-4 overflow-y-auto max-h-screen">
          {/* Step Indicator */}
          <Card
            size="small"
            className="shadow-md bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    currentStep === step ? "scale-110" : "opacity-70"
                  }`}
                  onClick={() => setCurrentStep(step)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep === step
                        ? "bg-white text-blue-600"
                        : currentStep > step
                        ? "bg-green-400 text-white"
                        : "bg-white/30 text-white"
                    }`}
                  >
                    {currentStep > step ? <CheckCircleOutlined /> : step}
                  </div>
                  <span className="text-xs mt-1 text-white/90">
                    {step === 1 && "Shape"}
                    {step === 2 && "Holes"}
                    {step === 3 && "Material"}
                    {step === 4 && "Corners"}
                    {step === 5 && "Review"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Step 1: Shape Drawing */}
          {currentStep === 1 && (
            <>
              <FileOperations
                stageRef={stageRef}
                fileInputRef={fileInputRef}
                onShapesLoaded={handleShapesLoaded}
              />

              <ShapeTemplates onShapeSelect={handleShapesLoaded} />

              {/* Editing Tools */}
              <Card title="🛠️ Drawing Tools" size="small" className="shadow-md">
                <Space orientation="vertical" className="w-full" size="small">
                  <div className="grid grid-cols-4 gap-2">
                    <Tooltip title="Move Shape (Drag entire shape)">
                      <Button
                        type={toolMode === "select" ? "primary" : "default"}
                        icon={<DragOutlined />}
                        onClick={() => setToolMode("select")}
                        style={{ height: 40 }}
                      >
                        Move
                      </Button>
                    </Tooltip>
                    <Tooltip title="Select Point">
                      <Button
                        type={
                          toolMode === "select-point" ? "primary" : "default"
                        }
                        icon={<AimOutlined />}
                        onClick={() => setToolMode("select-point")}
                        style={{ height: 40 }}
                      >
                        Point
                      </Button>
                    </Tooltip>
                    <Tooltip title="Add Point">
                      <Button
                        type={toolMode === "add-point" ? "primary" : "default"}
                        icon={<PlusOutlined />}
                        onClick={() => setToolMode("add-point")}
                        style={{ height: 40 }}
                      >
                        Add
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete Point">
                      <Button
                        type={
                          toolMode === "delete-point" ? "primary" : "default"
                        }
                        icon={<DeleteOutlined />}
                        onClick={() => setToolMode("delete-point")}
                        style={{ height: 40 }}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                  </div>

                  {toolMode === "select" && (
                    <Alert
                      type="info"
                      title="🖐️ Click and drag the shape to move it"
                      showIcon
                    />
                  )}

                  <Divider style={{ margin: "8px 0" }}>Rounding</Divider>
                  <Tooltip title="Round by Drag">
                    <Button
                      type={roundByDragActive ? "primary" : "default"}
                      icon={<RadiusSettingOutlined />}
                      onClick={toggleRoundByDrag}
                      block
                      style={{ height: 40 }}
                    >
                      🔵 Round by Drag
                    </Button>
                  </Tooltip>

                  <Button
                    icon={<BorderOutlined />}
                    onClick={autoSquare}
                    block
                    style={{ height: 40 }}
                  >
                    📐 Auto-Square (90°)
                  </Button>

                  {roundByDragActive && (
                    <Alert
                      type={roundingPoints.length === 2 ? "success" : "info"}
                      title={
                        roundingPoints.length === 0
                          ? "Step 1: Click first point"
                          : roundingPoints.length === 1
                          ? "Step 2: Click second adjacent point"
                          : "Step 3: Drag the green midpoint"
                      }
                      showIcon
                    />
                  )}
                </Space>
              </Card>

              <DimensionInput
                shapes={shapes}
                updateShapes={updateShapes}
                unit={unit}
                setUnit={setUnit}
              />
            </>
          )}

          {/* Step 2: Drilling Holes */}
          {currentStep === 2 && (
            <DrillingHoles
              drillingHoles={drillingHoles}
              setDrillingHoles={setDrillingHoles}
              isPlacingHole={isPlacingHole}
              setIsPlacingHole={setIsPlacingHole}
              setToolMode={setToolMode}
              shapes={shapes}
            />
          )}

          {/* Step 3: Material Selection */}
          {currentStep === 3 && (
            <MaterialSelector
              selectedMaterial={selectedMaterial}
              setSelectedMaterial={setSelectedMaterial}
              selectedThickness={selectedThickness}
              setSelectedThickness={setSelectedThickness}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              specialColorRequest={specialColorRequest}
              setSpecialColorRequest={setSpecialColorRequest}
              specialColorFile={specialColorFile}
              setSpecialColorFile={setSpecialColorFile}
            />
          )}

          {/* Step 4: Corner Settings */}
          {currentStep === 4 && (
            <CornerSettings
              shapes={shapes}
              cornerSettings={cornerSettings}
              setCornerSettings={setCornerSettings}
              selectedPoint={selectedPoint}
            />
          )}

          {/* Step 5: Review & Pricing */}
          {currentStep === 5 && (
            <>
              <ValidationPanel
                validationErrors={validationErrors}
                validateOrder={validateOrder}
              />
              <PricingPanel
                totalArea={totalArea}
                totalPerimeter={totalPerimeter}
                selectedMaterial={selectedMaterial}
                selectedThickness={selectedThickness}
                selectedColor={selectedColor}
                specialColorRequest={specialColorRequest}
                cornerSettings={cornerSettings}
                shapes={shapes}
              />
            </>
          )}

          {/* Precision Movement */}
          {selectedPoint && toolMode === "select-point" && (
            <Card
              title="🎯 Precision Movement"
              size="small"
              className="shadow-md border-2 border-purple-400"
            >
              <Space orientation="vertical" className="w-full" size="small">
                <Alert
                  title={`Point ${selectedPoint.pointIndex + 1}`}
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
                  />
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
                  />
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
                  />

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
                  />
                  <div></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    onClick={() => setSelectedPoint(null)}
                    block
                    size="small"
                  >
                    Deselect
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
                  >
                    Delete
                  </Button>
                </div>
              </Space>
            </Card>
          )}

          {/* Shape Properties */}
          {selectedShape && currentStep === 1 && (
            <ShapeProperties
              shapes={shapes}
              selectedShape={selectedShape}
              updateShapes={updateShapes}
              setSelectedShape={setSelectedShape}
              setSelectedPoint={setSelectedPoint}
            />
          )}

          {/* Settings */}
          {currentStep === 1 && (
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
          )}

          {/* Navigation Buttons */}
          <Card size="small" className="shadow-md">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  block
                  size="large"
                >
                  ← Previous
                </Button>
              )}
              <Button
                type="primary"
                onClick={handleNextStep}
                block
                size="large"
              >
                {currentStep === 5 ? "Submit Order" : "Next →"}
              </Button>
            </div>
          </Card>

          {/* Delivery Info */}
          <Card size="small" className="shadow-md bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              <div>
                <div className="font-bold text-amber-800">Delivery Time</div>
                <div className="text-sm text-amber-700">
                  3-4 weeks production time
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Canvas Area */}
        <div className="col-span-8" ref={containerRef}>
          <Card className="shadow-lg">
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
              calculateMeasurements={calculateMeasurements}
            />

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
                onClick={handleStageClick}
                onMouseMove={handleShapeMouseMove}
                onMouseUp={handleShapeMouseUp}
              >
                <Layer>
                  {gridVisible && renderGrid()}

                  {shapes
                    .filter((s) => s.visible)
                    .map((shape, shapeIndex) => {
                      const isSelected = shape.id === selectedShape;
                      const isLocked = shape.locked;

                      return (
                        <Group key={shape.id}>
                          <Line
                            points={shape.points.flat()}
                            stroke={isSelected ? "#722ed1" : shape.color}
                            strokeWidth={
                              (shape.strokeWidth || lineWidth) / scale
                            }
                            closed={shape.closed}
                            dash={
                              isLocked ? [10 / scale, 5 / scale] : undefined
                            }
                            fill={
                              shape.closed && isSelected
                                ? `${shape.color}20`
                                : undefined
                            }
                            onClick={(e) => {
                              if (!isLocked && toolMode === "select") {
                                setSelectedShape(shape.id);
                              }
                            }}
                            onTap={(e) => {
                              if (!isLocked && toolMode === "select") {
                                setSelectedShape(shape.id);
                              }
                            }}
                            onMouseDown={(e) => {
                              if (!isLocked && toolMode === "select") {
                                handleShapeMouseDown(e, shape.id);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (!isLocked && toolMode === "select") {
                                const container = e.target
                                  .getStage()
                                  .container();
                                container.style.cursor = "move";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDraggingShape) {
                                const container = e.target
                                  .getStage()
                                  .container();
                                container.style.cursor = "default";
                              }
                            }}
                            listening={!isLocked}
                          />

                          {/* Corner indicators */}
                          {shape.points.map((point, pointIndex) => {
                            const corner = cornerSettings[pointIndex];
                            if (
                              corner &&
                              corner.type === "radius" &&
                              corner.radius > 0
                            ) {
                              return (
                                <Circle
                                  key={`corner-indicator-${pointIndex}`}
                                  x={point[0]}
                                  y={point[1]}
                                  radius={16 / scale}
                                  fill="transparent"
                                  stroke="#52c41a"
                                  strokeWidth={2 / scale}
                                  dash={[4 / scale, 4 / scale]}
                                  listening={false}
                                />
                              );
                            }
                            return null;
                          })}

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

                              const isDraggable = toolMode === "select";

                              let pointColor = "#722ed1";
                              if (isSelectedForRounding) {
                                pointColor = "#ff4d4f";
                              } else if (isPointSelected) {
                                pointColor = "#f5222d";
                              }

                              const corner = cornerSettings[pointIndex];
                              if (
                                corner &&
                                corner.type === "radius" &&
                                corner.radius > 0
                              ) {
                                pointColor = "#52c41a";
                              }

                              return (
                                <Group key={`${shape.id}-point-${pointIndex}`}>
                                  <Circle
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
                                      handlePointClick(
                                        e,
                                        shapeIndex,
                                        pointIndex
                                      )
                                    }
                                  />
                                  {/* Point number label */}
                                  <Text
                                    x={point[0] + 10 / scale}
                                    y={point[1] - 15 / scale}
                                    text={`${pointIndex + 1}`}
                                    fontSize={10 / scale}
                                    fill="#666"
                                    listening={false}
                                  />
                                </Group>
                              );
                            })}

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

                              const distanceInUnit =
                                unit === "mm"
                                  ? ((distance * 25.4) / 12).toFixed(1) + "mm"
                                  : ((distance * 2.54) / 12).toFixed(2) + "cm";

                              return (
                                <Text
                                  key={`measure-${idx}`}
                                  x={midX}
                                  y={midY - 15 / scale}
                                  text={distanceInUnit}
                                  fontSize={11 / scale}
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

                  {renderPreviewArc()}
                  {renderRoundingMidpoint()}
                  {renderDrillingHoles()}

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

                  {/* Placing hole indicator */}
                  {isPlacingHole && (
                    <Text
                      x={stageSize.width / scale / 2 - 100}
                      y={20}
                      text="🎯 Click inside shape to place drilling hole"
                      fontSize={16 / scale}
                      fill="#ff4d4f"
                      fontStyle="bold"
                      listening={false}
                    />
                  )}
                </Layer>
              </Stage>
            </div>

            <StatusBar
              shapes={shapes}
              selectedShape={selectedShape}
              selectedPoint={selectedPoint}
              toolMode={toolMode}
              gridSize={gridSize}
              moveIncrement={moveIncrement}
              history={history}
              historyIndex={historyIndex}
              drillingHoles={drillingHoles}
              unit={unit}
            />
          </Card>
        </div>
      </div>

      {/* Validation Modal */}
      <Modal
        title="✅ Order Confirmation"
        open={showValidationModal}
        onOk={() => {
          const orderData = exportOrderData();
          message.success("Order submitted successfully!");
          setShowValidationModal(false);
        }}
        onCancel={() => setShowValidationModal(false)}
        okText="Confirm Order"
        cancelText="Go Back"
        width={600}
      >
        <div className="space-y-4">
          <Alert
            type="success"
            title="All validations passed!"
            description="Your order is ready to be submitted."
            showIcon
          />

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold mb-2">Order Summary:</h4>
            <ul className="space-y-1 text-sm">
              <li>📐 Shape Area: {totalArea.toFixed(2)} sq ft</li>
              <li>📏 Perimeter: {totalPerimeter.toFixed(2)} ft</li>
              <li>🕳️ Drilling Holes: {drillingHoles.length}</li>
              <li>🎨 Material: {selectedMaterial || "Not selected"}</li>
              <li>📊 Thickness: {selectedThickness || "Not selected"}</li>
              <li>
                🌈 Color:{" "}
                {selectedColor || specialColorRequest || "Not selected"}
              </li>
            </ul>
          </div>

          <Alert
            type="info"
            title="Production Time: 3-4 weeks"
            description="Final pricing may change after review."
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default DxfEditor;
