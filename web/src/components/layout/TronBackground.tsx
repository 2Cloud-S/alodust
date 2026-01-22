interface TronBackgroundProps {
  showGrid?: boolean;
  showPerspective?: boolean;
  showAmbient?: boolean;
  showScanlines?: boolean;
}

export function TronBackground({
  showGrid = true,
  showPerspective = true,
  showAmbient = true,
  showScanlines = false,
}: TronBackgroundProps) {
  return (
    <>
      {/* Ambient gradient blobs */}
      {showAmbient && <div className="ambient-glow" />}

      {/* Tron grid overlay */}
      {showGrid && <div className="tron-grid" />}

      {/* 3D perspective grid at bottom */}
      {showPerspective && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40%',
            overflow: 'hidden',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <div className="perspective-grid" />
        </div>
      )}

      {/* Scanline overlay */}
      {showScanlines && <div className="scanline-overlay" />}
    </>
  );
}
