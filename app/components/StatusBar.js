import React from 'react'

function StatusBar({shapes, selectedShape, selectedPoint, toolMode, gridSize, moveIncrement, history, historyIndex}) {
  return (
    <div>
        <div className="mt-3 flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
            <div className="font-medium">
              {selectedPoint ? (
                <span className="text-red-600">
                  📍 Point Selected: (
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
                  ) - Use arrow buttons to move
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
                📏 Grid: {gridSize}" | Move: {moveIncrement}"
              </span>
              <span>
                📊 Total Points:{" "}
                {shapes.reduce((sum, shape) => sum + shape.points.length, 0)}
              </span>
              <span>
                📜 History: {historyIndex + 1} / {history.length}
              </span>
            </div>
          </div>
    </div>
  )
}

export default StatusBar