// show the remote UI over HTTPS
figma.showUI(__uiURL__, { width: 180, height: 100 });

// when the UI posts back a picked color...
figma.ui.onmessage = msg => {
  if (msg.type === 'color-picked') {
    const hex = msg.hex;
    // convert to normalized RGB
    const r = parseInt(hex.substr(1,2),16) / 255;
    const g = parseInt(hex.substr(3,2),16) / 255;
    const b = parseInt(hex.substr(5,2),16) / 255;

    // apply to every selected node’s first solid fill
    for (const node of figma.currentPage.selection) {
      if ('fills' in node && Array.isArray(node.fills)) {
        const fills = node.fills.map(p => {
          if (p.type === 'SOLID') {
            return {
              type: 'SOLID',
              visible: p.visible,
              opacity: p.opacity != null ? p.opacity : 1,
              blendMode: p.blendMode,
              color: { r, g, b }
            };
          }
          return p;
        });
        node.fills = fills;
      }
    }

    figma.notify(`Applied ${hex}`); 
  }
};
