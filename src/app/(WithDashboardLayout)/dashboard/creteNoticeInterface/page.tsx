"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { FaTrashAlt } from "react-icons/fa";
// import io, { Socket } from "socket.io-client";

interface Notice {
  id: string;
  notice_id?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  color?: string;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const ReactGridLayout = dynamic(() => import("react-grid-layout"), { ssr: false });

const Home: React.FC = () => {
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  // const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // const socketConnection = io();
    // setSocket(socketConnection);

    // fetchNotices();
    // socketConnection.on("notice-update", fetchNotices);

    return () => {
      // socketConnection.disconnect();
    };
  }, []);

  // const fetchNotices = async () => {
  //   try {
  //     const response = await fetch("/api/get");
  //     const data: Notice[] = await response.json();

  //     if (!Array.isArray(data)) {
  //       throw new Error("API response is not an array");
  //     }

  //     setLayout(
  //       data.map(item => ({
  //         i: item.id.toString(),
  //         x: item.left || 0,
  //         y: item.top || 0,
  //         w: item.width || 4,
  //         h: item.height || 2,
  //         color: item.color || "#ffcc00",
  //       }))
  //     );
  //     setNotices(data);
  //   } catch (error) {
  //     console.error("Error fetching notices:", error);
  //   }
  // };

  // const saveNoticeToDB = async (notice: Partial<Notice>) => {
  //   try {
  //     await fetch("/api/save", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(notice),
  //     });
  //     fetchNotices();
  //   } catch (error) {
  //     console.error("Error saving notice:", error);
  //   }
  // };

  // const deleteItem = async (id: string) => {
  //   try {
  //     await fetch("/api/delete", {
  //       method: "DELETE",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ id }),
  //     });
  //     fetchNotices();
  //   } catch (error) {
  //     console.error("Error deleting notice:", error);
  //   }
  // };

  const addShape = () => {
    const newShape: LayoutItem = {
      i: `shape-${Date.now()}`,
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      color: "#ffcc00",
    };
    setLayout(prevLayout => [...prevLayout, newShape]);
    // saveNoticeToDB(newShape);
  };

  // const updateColor = (id: string, newColor: string) => {
  //   setLayout(prevLayout =>
  //     prevLayout.map(item => (item.i === id ? { ...item, color: newColor } : item))
  //   );
  //   saveNoticeToDB({ id, color: newColor });
  // };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>📢 Smart Notice Board - Admin Panel</h1>

      <h3 style={{ marginTop: "20px", color: "#555" }}>Available Notices</h3>

      {/* Draggable Notice Title */}
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData("title", "Important Announcement")}
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "10px",
          padding: "10px",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          cursor: "grab",
          display: "inline-block",
        }}
      >
        📌 Important Announcement
      </div>

      <button
        onClick={addShape}
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
          transition: "0.3s",
        }}
        onMouseOver={e => (e.currentTarget.style.background = "#0056b3")}
        onMouseOut={e => (e.currentTarget.style.background = "#007bff")}
      >
        ➕ Create Shape
      </button>

      <ReactGridLayout
        className="layout"
        layout={layout}
        onLayoutChange={newLayout => {
          newLayout.forEach(item => {
            // const existingNotice = notices.find(n => n.id === item.i); // Find existing notice
            // saveNoticeToDB({
            //   id: item.i,
            //   notice_id: existingNotice?.notice_id || "", // Keep existing title
            //   width: item.w,
            //   height: item.h,
            //   left: item.x,
            //   top: item.y,
            //   color: existingNotice?.color || "#ffcc00", // Keep color
            // });
          });
        }}
        
        cols={12}
        rowHeight={30}
        width={1200}
        margin={[10, 40]}
      >
        {layout.map(item => (
          <div key={item.i} data-grid={item}>
            <div
              style={{
                backgroundColor: item.color || "#ffcc00",
                padding: "15px",
                textAlign: "center",
                height: "100%",
                borderRadius: "10px",
                boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                position: "relative",
              }}
              onDragOver={(e) => e.preventDefault()} // Allow drop
              onDrop={(e) => {
                const droppedTitle = e.dataTransfer.getData("title");
                if (droppedTitle) {
                  // saveNoticeToDB({ id: item.i, notice_id: droppedTitle }); // Save to DB
                  setNotices((prev) =>
                    prev.map((n) => (n.id === item.i ? { ...n, notice_id: droppedTitle } : n))
                  );
                }
              }}
            >
              {notices.find((n) => n.id === item.i)?.notice_id ? (
                <h3 style={{ color: "#333" }}>{notices.find((n) => n.id === item.i)?.notice_id}</h3>
              ) : (
                <p style={{ color: "#555" }}> Drag Title Here </p>
              )}

              <input
                type="color"
                value={item.color}
                // onChange={e => updateColor(item.i, e.target.value)}
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  border: "none",
                  cursor: "pointer",
                }}
              />

              <button
                onClick={() => deleteItem(item.i)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <FaTrashAlt color="red" size={20} />
              </button>
            </div>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};

export default Home;
