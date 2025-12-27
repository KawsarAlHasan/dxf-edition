export const parseDxfFile = (content) => {
  try {
    const lines = content.split("\n");
    const entities = [];
    let currentEntity = null;

    for (let i = 0; i < lines.length; i++) {
      const code = parseInt(lines[i].trim());
      const value = lines[i + 1] ? lines[i + 1].trim() : "";

      if (code === 0) {
        // Start of new entity
        if (currentEntity) {
          entities.push(currentEntity);
        }

        currentEntity = {
          type: value,
          layer: "0",
          color: 256,
          vertices: [],
        };
      }

      if (currentEntity) {
        switch (code) {
          case 8:
            currentEntity.layer = value;
            break;
          case 62:
            currentEntity.color = parseInt(value) || 256;
            break;
          case 10:
            // X coordinate
            const x = parseFloat(value);
            const y = parseFloat(lines[i + 2]?.trim()) || 0;
            currentEntity.vertices.push({ x, y });
            break;
          case 20:
            // Y coordinate (handled above)
            break;
          case 70:
            // Polyline flag
            currentEntity.closed = (parseInt(value) & 1) !== 0;
            break;
        }
      }

      i++; // Skip value line
    }

    // Add last entity
    if (currentEntity) {
      entities.push(currentEntity);
    }

    return entities;
  } catch (error) {
    console.error("DXF parsing error:", error);
    return [];
  }
};

// Extract shapes from DXF entities
export const extractShapesFromDxf = (dxfData) => {
  const shapes = [];

  if (!dxfData || !dxfData.entities) return shapes;

  dxfData.entities.forEach((entity) => {
    switch (entity.type) {
      case "LINE":
        shapes.push({
          type: "line",
          points: [
            [entity.start.x || 0, entity.start.y || 0],
            [entity.end.x || 0, entity.end.y || 0],
          ],
          closed: false,
          color: getColorByIndex(entity.color || 0),
        });
        break;

      case "LWPOLYLINE":
      case "POLYLINE":
        if (entity.vertices && entity.vertices.length > 0) {
          const points = entity.vertices.map((v) => [v.x || 0, v.y || 0]);
          shapes.push({
            type: "polyline",
            points: points,
            closed: entity.closed || false,
            color: getColorByIndex(entity.color || 1),
          });
        }
        break;

      case "CIRCLE":
        if (entity.center && entity.radius) {
          // Approximate circle with 36 points
          const points = [];
          const segments = 36;
          for (let i = 0; i < segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            points.push([
              entity.center.x + entity.radius * Math.cos(angle),
              entity.center.y + entity.radius * Math.sin(angle),
            ]);
          }
          shapes.push({
            type: "circle",
            points: points,
            closed: true,
            color: getColorByIndex(entity.color || 2),
          });
        }
        break;

      case "ARC":
        if (
          entity.center &&
          entity.radius &&
          entity.startAngle &&
          entity.endAngle
        ) {
          const points = [];
          const segments = 36;
          const start = (entity.startAngle * Math.PI) / 180;
          const end = (entity.endAngle * Math.PI) / 180;
          const angleRange = end - start;

          for (let i = 0; i <= segments; i++) {
            const angle = start + (angleRange * i) / segments;
            points.push([
              entity.center.x + entity.radius * Math.cos(angle),
              entity.center.y + entity.radius * Math.sin(angle),
            ]);
          }
          shapes.push({
            type: "arc",
            points: points,
            closed: false,
            color: getColorByIndex(entity.color || 3),
          });
        }
        break;
    }
  });

  return shapes;
};

// Helper function to get color by index
const getColorByIndex = (colorIndex) => {
  const dxfColors = [
    "#000000",
    "#FF0000",
    "#FFFF00",
    "#00FF00",
    "#00FFFF",
    "#0000FF",
    "#FF00FF",
    "#FFFFFF",
    "#808080",
    "#C0C0C0",
    "#FF8080",
    "#FFC800",
    "#FFFF80",
    "#80FF80",
    "#80FFFF",
    "#8080FF",
    "#FF80FF",
    "#FF0080",
    "#FF8040",
    "#FFC080",
  ];
  return dxfColors[Math.abs(colorIndex) % dxfColors.length] || "#000000";
};

// Calculate area of a polygon
export const calculatePolygonArea = (points) => {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }

  return Math.abs(area / 2);
};

// Calculate perimeter of a shape
export const calculatePerimeter = (points, closed = true) => {
  if (points.length < 2) return 0;

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
