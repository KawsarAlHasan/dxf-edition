"use client";
import {
  RedoOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Divider, Statistic, Tooltip } from "antd";
import { showToast } from "nextjs-toast-notify";

function MainToolbar({
  setShapes,
  setHistoryIndex,
  historyIndex,
  history,
  scale,
  setScale,
  shapes,
  totalArea,
  totalPerimeter,
}) {
  // Undo/Redo System
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setShapes(prevState);
      setHistoryIndex(historyIndex - 1);
      calculateMeasurements(prevState);
      showToast.success("Undo successful", { duration: 2000 });
    } else {
      showToast.warning("Nothing to undo", { duration: 2000 });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setShapes(nextState);
      setHistoryIndex(historyIndex + 1);
      calculateMeasurements(nextState);
      showToast.success("Redo successful", { duration: 2000 });
    } else {
      showToast.warning("Nothing to redo", { duration: 2000 });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between mb-4 gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <Tooltip title="Undo">
          <Button
            icon={<UndoOutlined />}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            size="large"
          />
        </Tooltip>
        <Tooltip title="Redo">
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
        <Button onClick={() => setScale(1)} size="large" disabled={scale === 1}>
          Reset Zoom
        </Button>
        <span className="text-sm font-medium px-2 py-1 bg-white rounded">
          {Math.round(scale * 100)}%
        </span>

        <Divider orientation="vertical" />

        <span className="text-sm font-medium px-3 py-1 bg-blue-100 rounded">
          {shapes.filter((s) => s.visible).length} / {shapes.length} shapes
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
  );
}

export default MainToolbar;
