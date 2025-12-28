"use client";

import { FloatButton, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import DxfEditor from "./components/DxfEditor";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="container mx-auto">
        <DxfEditor />
      </main>
    </div>
  );
}
