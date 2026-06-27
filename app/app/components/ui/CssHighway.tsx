'use client';
import React from 'react';
import './CssHighway.css';

export default function CssHighway() {
  return (
    <div className="css-highway">
      {/* Horizon glow line */}
      <div className="css-highway__horizon" />

      {/* Ambient flows */}
      <div className="css-highway__glow-left" />
      <div className="css-highway__glow-right" />

      {/* Tilt Scene for 3D receding view */}
      <div className="css-highway__scene">
        {/* Road */}
        <div className="css-highway__road" />

        {/* Left side sticks */}
        <div className="css-highway__stick css-highway__stick-l1" />
        <div className="css-highway__stick css-highway__stick-l2" />
        <div className="css-highway__stick css-highway__stick-l3" />
        <div className="css-highway__stick css-highway__stick-l4" />

        {/* Right side sticks */}
        <div className="css-highway__stick css-highway__stick-r1" />
        <div className="css-highway__stick css-highway__stick-r2" />
        <div className="css-highway__stick css-highway__stick-r3" />
        <div className="css-highway__stick css-highway__stick-r4" />

        {/* Left car lights (Purple/Magenta) */}
        <div className="css-highway__streak css-highway__left-1" />
        <div className="css-highway__streak css-highway__left-2" />
        <div className="css-highway__streak css-highway__left-3" />
        <div className="css-highway__streak css-highway__left-4" />
        <div className="css-highway__streak css-highway__left-5" />
        <div className="css-highway__streak css-highway__left-6" />
        <div className="css-highway__streak css-highway__left-7" />
        <div className="css-highway__streak css-highway__left-8" />

        {/* Right car lights (Cyan/Teal) */}
        <div className="css-highway__streak css-highway__right-1" />
        <div className="css-highway__streak css-highway__right-2" />
        <div className="css-highway__streak css-highway__right-3" />
        <div className="css-highway__streak css-highway__right-4" />
        <div className="css-highway__streak css-highway__right-5" />
        <div className="css-highway__streak css-highway__right-6" />
        <div className="css-highway__streak css-highway__right-7" />
        <div className="css-highway__streak css-highway__right-8" />
      </div>
    </div>
  );
}
