// Show our UI
figma.showUI(__html__, { width: 260, height: 240 });

// Helper: pull all unique solid-fill colors from the current selection
function getSelectionColors() {
  const map = new Map();
  figma.currentPage.selection.forEach(node => {
    if ('fills' in node && Array.isArray(node.fills)) {
      node.fills.forEach(paint => {
        if (paint.type === 'SOLID') {
          const r = Math.round(paint.color.r * 255);
          const g = Math.round(paint.color.g * 255);
          const b = Math.round(paint.color.b * 255);
          const hex = `#${((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1)}`;
          const opacity = paint.opacity != null ? paint.opacity : 1;
          const key = `${hex}|${opacity}`;
          if (!map.has(key)) {
            map.set(key, { hex, opacity });
          }
        }
      });
    }
  });
  return Array.from(map.values());
}

// Send the initial color array to the UI
figma.ui.postMessage({ type: 'init-colors', colors: getSelectionColors() });

// Listen for when the UI picks a color via the eyedropper
figma.ui.onmessage = msg => {
  if (msg.type === 'color-picked') {
    const { index, hex } = msg;
    const colors = getSelectionColors();
    const orig = colors[index];
    if (!orig) return;

    // convert hex → normalized RGB floats
    const r = parseInt(hex.substr(1,2),16) / 255;
    const g = parseInt(hex.substr(3,2),16) / 255;
    const b = parseInt(hex.substr(5,2),16) / 255;

    // apply to every selected node that used the original color
    for (const node of figma.currentPage.selection) {
      if ('fills' in node && Array.isArray(node.fills)) {
        const newFills = node.fills.map(p => {
          if (p.type === 'SOLID') {
            const rr = Math.round(p.color.r * 255);
            const gg = Math.round(p.color.g * 255);
            const bb = Math.round(p.color.b * 255);
            const pOpacity = p.opacity != null ? p.opacity : 1;
            const key2 = `#${((1<<24)+(rr<<16)+(gg<<8)+bb).toString(16).slice(1)}|${pOpacity}`;
            if (key2 === `${orig.hex}|${orig.opacity}`) {
              // rebuild the paint object with the new RGB
              return {
                type: 'SOLID',
                visible: p.visible,
                opacity: pOpacity,
                blendMode: p.blendMode,
                color: { r, g, b }
              };
            }
          }
          return p;
        });
        node.fills = newFills;
      }
    }

    figma.notify(`Replaced ${orig.hex} → ${hex}`);
  }
};
