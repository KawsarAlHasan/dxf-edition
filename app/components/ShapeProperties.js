import {
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Button, Card } from "antd";
import { showToast } from "nextjs-toast-notify";
import React from "react";

function ShapeProperties({
  shapes,
  selectedShape,
  updateShapes,
  setSelectedShape,
  setSelectedPoint,
}) {
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

  return (
    <div>
      <Card title="🎨 Shape Properties" size="small" className="shadow-md">
        <div className="space-y-3">
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
    </div>
  );
}

export default ShapeProperties;
