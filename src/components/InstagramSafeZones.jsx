import React from 'react';

export default function InstagramSafeZones() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Top Header Safe Zone */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '12%', background: 'rgba(255, 0, 0, 0.2)', borderBottom: '1px dashed red' }}>
        <span style={{ position: 'absolute', bottom: '4px', left: '8px', color: 'red', fontSize: '10px', fontWeight: 'bold' }}>TOP UI / HEADER</span>
      </div>

      {/* Right Side Buttons Safe Zone */}
      <div style={{ position: 'absolute', top: '40%', right: 0, width: '15%', bottom: '15%', background: 'rgba(255, 0, 0, 0.2)', borderLeft: '1px dashed red' }}>
        <span style={{ position: 'absolute', top: '50%', right: '4px', transform: 'translateY(-50%)', color: 'red', fontSize: '10px', fontWeight: 'bold', writingMode: 'vertical-rl' }}>INTERACTION BUTTONS</span>
      </div>

      {/* Bottom Caption Safe Zone */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', background: 'rgba(255, 0, 0, 0.2)', borderTop: '1px dashed red' }}>
        <span style={{ position: 'absolute', top: '4px', left: '8px', color: 'red', fontSize: '10px', fontWeight: 'bold' }}>CAPTION / USERNAME / AUDIO</span>
      </div>
      
      {/* Safe Area Border */}
      <div style={{ position: 'absolute', top: '12%', left: '5%', right: '15%', bottom: '22%', border: '2px solid rgba(0, 255, 0, 0.5)' }}>
        <span style={{ position: 'absolute', top: '4px', left: '4px', color: '#00ff00', fontSize: '10px', fontWeight: 'bold' }}>SAFE ZONE</span>
      </div>
    </div>
  );
}
