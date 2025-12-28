"use client";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Space } from "antd";
import { showToast } from "nextjs-toast-notify";
import React, { useState } from "react";

const initialShapes = [
  { id: 1, name: "PLAAT 1", file: "/PLAAT1.dxf" },
  { id: 2, name: "PLAAT 2", file: "/PLAAT2.dxf" },
  { id: 3, name: "PLAAT 3", file: "/PLAAT3.dxf" },
];

function FileOperations({ stageRef, fileInputRef, onShapesLoaded }) {
  const [availableDxfFiles] = useState(initialShapes);

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

  // Enhanced DXF parser - moved here to be passed as prop
  const parseDxfContent = (lines) => {
    const shapes = [];
    let currentShape = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

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

      if (currentShape) {
        if (line === "10" || line === "20") {
          const x = parseFloat(lines[i + 1]) || 0;
          const y = parseFloat(lines[i + 2]) || 0;
          currentShape.points.push([x * 0.5 + 200, y * 0.5 + 200]);
          i += 2;
        }

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

  // Load DXF File from predefined list
  const loadPredefinedDxf = async (dxfFile) => {
    try {
      const response = await fetch(dxfFile.file);
      if (!response.ok) {
        showToast.error(`Failed to load ${dxfFile.name}`, { duration: 2000 });
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
          strokeWidth: 2,
          visible: true,
          locked: false,
          name: `${dxfFile.name} - Shape ${idx + 1}`,
        }));

        onShapesLoaded(newShapes);
        showToast.success(
          `Loaded ${parsedShapes.length} shapes from ${dxfFile.name}`,
          {
            duration: 2000,
          }
        );
      } else {
        showToast.warning("No shapes found in DXF file", { duration: 2000 });
      }
    } catch (error) {
      showToast.error("Error loading DXF file", { duration: 2000 });
      console.error("DXF Load Error:", error);
    }
  };

  // DXF File Upload Handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".dxf")) {
      showToast.error("Please upload a .dxf file", { duration: 2000 });
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
            strokeWidth: 2,
            visible: true,
            locked: false,
            name: `Uploaded Shape ${idx + 1}`,
          }));

          onShapesLoaded(newShapes);
          showToast.success(
            `Loaded ${parsedShapes.length} shapes from DXF file`,
            { duration: 2000 }
          );
        } else {
          showToast.warning("No shapes found in DXF file", { duration: 2000 });
        }
      } catch (error) {
        showToast.error("Error parsing DXF file", { duration: 2000 });
        console.error("DXF Parse Error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  // Export as Image
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

      showToast.success("Exported as PNG image", { duration: 2000 });
    }
  };

  return (
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
  );
}

export default FileOperations;
