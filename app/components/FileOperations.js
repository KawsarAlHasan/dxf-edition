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

  // COMPLETELY REWRITTEN DXF PARSER - WORKING VERSION
  const parseDxfContent = (content) => {
    const lines = content.split('\n').map(line => line.trim());
    const entities = [];
    
    let inEntitiesSection = false;
    let i = 0;
    
    // Find ENTITIES section
    while (i < lines.length) {
      if (lines[i] === '0' && lines[i + 1] === 'SECTION') {
        if (lines[i + 2] === '2' && lines[i + 3] === 'ENTITIES') {
          inEntitiesSection = true;
          i += 4;
          break;
        }
      }
      i++;
    }
    
    if (!inEntitiesSection) {
      console.log('ENTITIES section not found');
      return [];
    }
    
    // Parse entities
    while (i < lines.length) {
      const code = lines[i];
      const value = lines[i + 1];
      
      // Check for end of section
      if (code === '0' && value === 'ENDSEC') {
        break;
      }
      
      // Found an entity
      if (code === '0') {
        if (value === 'LINE') {
          const lineEntity = parseLINE(lines, i);
          if (lineEntity) {
            entities.push(lineEntity);
          }
        } else if (value === 'LWPOLYLINE') {
          const polyEntity = parseLWPOLYLINE(lines, i);
          if (polyEntity) {
            entities.push(polyEntity);
          }
        } else if (value === 'POLYLINE') {
          const polyEntity = parsePOLYLINE(lines, i);
          if (polyEntity) {
            entities.push(polyEntity);
          }
        }
      }
      
      i++;
    }
    
    console.log(`Parsed ${entities.length} entities`);
    
    if (entities.length === 0) {
      return [];
    }
    
    // Transform to canvas coordinates
    return transformToCanvas(entities);
  };
  
  // Parse LINE entity
  const parseLINE = (lines, startIndex) => {
    let i = startIndex + 2; // Skip "0" and "LINE"
    const entity = { type: 'LINE', points: [] };
    let x1, y1, x2, y2;
    
    while (i < lines.length && lines[i] !== '0') {
      const code = lines[i];
      const value = lines[i + 1];
      
      if (code === '10') x1 = parseFloat(value);
      else if (code === '20') y1 = parseFloat(value);
      else if (code === '11') x2 = parseFloat(value);
      else if (code === '21') y2 = parseFloat(value);
      
      i += 2;
    }
    
    if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
      entity.points = [[x1, y1], [x2, y2]];
      entity.closed = false;
      return entity;
    }
    
    return null;
  };
  
  // Parse LWPOLYLINE entity
  const parseLWPOLYLINE = (lines, startIndex) => {
    let i = startIndex + 2;
    const entity = { type: 'LWPOLYLINE', points: [], closed: false };
    let currentX = null;
    
    while (i < lines.length && lines[i] !== '0') {
      const code = lines[i];
      const value = lines[i + 1];
      
      if (code === '70') {
        entity.closed = (parseInt(value) & 1) === 1;
      } else if (code === '10') {
        currentX = parseFloat(value);
      } else if (code === '20' && currentX !== null) {
        const y = parseFloat(value);
        entity.points.push([currentX, y]);
        currentX = null;
      }
      
      i += 2;
    }
    
    return entity.points.length >= 2 ? entity : null;
  };
  
  // Parse POLYLINE entity (with VERTEX)
  const parsePOLYLINE = (lines, startIndex) => {
    let i = startIndex + 2;
    const entity = { type: 'POLYLINE', points: [], closed: false };
    
    // Read POLYLINE flags
    while (i < lines.length) {
      const code = lines[i];
      const value = lines[i + 1];
      
      if (code === '70') {
        entity.closed = (parseInt(value) & 1) === 1;
      }
      
      if (code === '0') {
        if (value === 'VERTEX') {
          // Parse VERTEX
          i += 2;
          let x, y;
          while (i < lines.length && lines[i] !== '0') {
            const vCode = lines[i];
            const vValue = lines[i + 1];
            
            if (vCode === '10') x = parseFloat(vValue);
            else if (vCode === '20') y = parseFloat(vValue);
            
            i += 2;
          }
          if (x !== undefined && y !== undefined) {
            entity.points.push([x, y]);
          }
          continue;
        } else if (value === 'SEQEND') {
          break;
        } else {
          break;
        }
      }
      
      i += 2;
    }
    
    return entity.points.length >= 2 ? entity : null;
  };
  
  // Transform entities to canvas coordinates
  const transformToCanvas = (entities) => {
    // Calculate bounds
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    entities.forEach(entity => {
      entity.points.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });
    
    console.log(`Bounds: X(${minX.toFixed(2)} to ${maxX.toFixed(2)}), Y(${minY.toFixed(2)} to ${maxY.toFixed(2)})`);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    if (width === 0 || height === 0) {
      console.log('Invalid dimensions');
      return entities;
    }
    
    // Canvas settings
    const canvasWidth = 1200;
    const canvasHeight = 700;
    const padding = 50;
    
    // Calculate scale
    const scaleX = (canvasWidth - 2 * padding) / width;
    const scaleY = (canvasHeight - 2 * padding) / height;
    const scale = Math.min(scaleX, scaleY) * 0.8;
    
    console.log(`Scale: ${scale.toFixed(4)}`);
    
    // Transform points
    entities.forEach(entity => {
      entity.points = entity.points.map(([x, y]) => {
        const newX = (x - minX) * scale + padding;
        const newY = canvasHeight - ((y - minY) * scale + padding);
        return [newX, newY];
      });
    });
    
    return entities;
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
      const parsedShapes = parseDxfContent(text);

      if (parsedShapes.length > 0) {
        const newShapes = parsedShapes.map((shape, idx) => ({
          type: shape.type === 'LINE' ? 'line' : 'polyline',
          points: shape.points,
          closed: shape.closed,
          id: `dxf-${Date.now()}-${idx}`,
          color: "#1890ff",
          strokeWidth: 2,
          visible: true,
          locked: false,
          name: `${dxfFile.name} - Shape ${idx + 1}`,
        }));

        onShapesLoaded(newShapes);
        showToast.success(
          `Loaded ${parsedShapes.length} shapes from ${dxfFile.name}`,
          { duration: 2000 }
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
        const parsedShapes = parseDxfContent(text);

        if (parsedShapes.length > 0) {
          const newShapes = parsedShapes.map((shape, idx) => ({
            type: shape.type === 'LINE' ? 'line' : 'polyline',
            points: shape.points,
            closed: shape.closed,
            id: `dxf-${Date.now()}-${idx}`,
            color: "#1890ff",
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