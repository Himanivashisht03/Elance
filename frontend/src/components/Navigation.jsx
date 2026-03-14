//frontend\src\components\Navigation.jsx
import React, { useState, useContext } from "react";
import { Drawer, Box, Divider, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { id: "home", label: "Home", path: "/" },
    { id: "dashboard", label: "Dashboard", path: "/dashboard", auth: true },
    { id: "skill-radar", label: "Skill Radar", path: "/skill-radar", auth: true },
    { id: "career-planner", label: "Career Planner", path: "/career-planner", auth: true },
    { id: "resume", label: "Resume", path: "/resume", auth: true },
    { id: "aboutus", label: "About Us", path: "/aboutus" },
    { id: "login", label: "Login", path: "/login", guest: true },
  ];

  const activeItem = menuItems.find(
    (item) => item.path === location.pathname
  )?.id;

  const handleClick = (item) => {
    if (item.id === "login" && user) return;
    navigate(item.path);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 80,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 80,
          boxSizing: "border-box",
          background: "#f9f9f9",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 4,
        },
      }}
    >
      {menuItems.map((item) => {
        if (item.auth && !user) return null;
        if (item.guest && user) return null;

        const isActive = activeItem === item.id;
        const isHovered = hoveredItem === item.id;

        return (
          <Box
            key={item.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              width: "100%",
              mb: 2,
            }}
            onClick={() => handleClick(item)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* The single line */}
            <Divider
              sx={{
                width: "60%",
                borderBottomWidth: 3,
                borderColor: isActive ? "#1976d2" : "#bbb",
                mb: 1,
              }}
            />

            {/* Show label only on hover */}
            {isHovered && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  fontWeight: "bold",
                  color: "#1976d2",
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Typography>
            )}
          </Box>
        );
      })}

      {/* Logout button as a line item */}
      {user && (
        <Box
          sx={{
            mt: "auto",
            mb: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            width: "100%",
          }}
          onClick={logout}
          onMouseEnter={() => setHoveredItem("logout")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Divider
            sx={{
              width: "60%",
              borderBottomWidth: 3,
              borderColor: "#f44336",
              mb: 1,
            }}
          />
          {hoveredItem === "logout" && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                fontWeight: "bold",
                color: "#f44336",
                fontSize: "0.8rem",
              }}
            >
              Logout
            </Typography>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default Navigation;
