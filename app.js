const animateBtn = document.getElementById("animateBtn");
const animationRoot = document.querySelector(".animation-component");
const partButtons = Array.from(document.querySelectorAll(".anim-part-btn"));
const bgBtn = document.getElementById("bgBtn");
const body = document.body;

if (bgBtn && body) {
  let hasBgImage = false;

  bgBtn.addEventListener("click", () => {
    hasBgImage = !hasBgImage;
    body.classList.toggle("bg-image-on", hasBgImage);
  });
}

if (animateBtn && animationRoot) {
  const leftDots = Array.from(animationRoot.querySelectorAll(".controls-left-anim .dot"));
  const rightDots = Array.from(animationRoot.querySelectorAll(".controls-right-anim .dot"));
  const teams = Array.from(animationRoot.querySelectorAll(".team-anim"));
  const scores = Array.from(animationRoot.querySelectorAll(".score"));
  const iconContainer = animationRoot.querySelector(".icon-container-anim");
  const lockIcon = document.getElementById("lockAnim");
  const lockWrap = animationRoot.querySelector(".lock-wrap-anim");
  const topArc = animationRoot.querySelector(".arc-top-74");
  const bottomArc = animationRoot.querySelector(".arc-bottom-74");
  const leftArc = animationRoot.querySelector(".arc-left");
  const rightArc = animationRoot.querySelector(".arc-right");
  const topArcCrop = document.createElement("div");
  const bottomArcCrop = document.createElement("div");

  if (topArc?.parentElement) {
    topArcCrop.style.position = "absolute";
    topArcCrop.style.left = "50%";
    topArcCrop.style.transform = "translateX(-50%)";
    topArcCrop.style.overflow = "hidden";
    topArc.parentElement.insertBefore(topArcCrop, topArc);
    topArcCrop.appendChild(topArc);
  }

  if (bottomArc?.parentElement) {
    bottomArcCrop.style.position = "absolute";
    bottomArcCrop.style.left = "50%";
    bottomArcCrop.style.transform = "translateX(-50%)";
    bottomArcCrop.style.overflow = "hidden";
    bottomArc.parentElement.insertBefore(bottomArcCrop, bottomArc);
    bottomArcCrop.appendChild(bottomArc);
  }
  const teamSvgs = teams
    .map((team) => team.querySelector(".team-shape-svg"))
    .filter(Boolean);
  const teamBasePaths = teamSvgs
    .map((svg, index) => {
      const path = Array.from(svg.querySelectorAll("path")).find(
        (candidate) => candidate.getAttribute("fill") === "var(--navy56)" && !candidate.hasAttribute("mask")
      );
      if (!path) {
        return null;
      }

      const clipId = `team-trim-clip-anim-${index}`;
      const existingDefs = svg.querySelector("defs");
      const defs = existingDefs || document.createElementNS("http://www.w3.org/2000/svg", "defs");
      if (!existingDefs) {
        svg.insertBefore(defs, svg.firstChild);
      }

      let clipPath = defs.querySelector(`#${clipId}`);
      if (!clipPath) {
        clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.setAttribute("id", clipId);
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "4");
        rect.setAttribute("width", "64");
        rect.setAttribute("height", "36");
        clipPath.appendChild(rect);
        defs.appendChild(clipPath);
      }

      return { path, clipId, index };
    })
    .filter(Boolean);
  const teamPanels = teams.map((team, index) => {
    const panel = document.createElement("div");
    panel.style.position = "absolute";
    panel.style.top = "4px";
    panel.style.width = "32px";
    panel.style.height = "36px";
    panel.style.background = "rgba(19, 27, 44, 0.56)";
    panel.style.pointerEvents = "none";

    if (index === 0) {
      panel.style.left = "0";
      panel.style.borderRadius = "2px 0 0 2px";
    } else {
      panel.style.right = "0";
      panel.style.borderRadius = "0 2px 2px 0";
    }

    team.insertBefore(panel, team.firstChild);
    return panel;
  });

  const COLOR_WHITE_56 = [255, 255, 255, 0.56];
  const COLOR_WHITE_36 = [255, 255, 255, 0.36];
  const COLOR_WHITE_40 = [255, 255, 255, 0.4];
  const COLOR_OWB = [22, 201, 255, 1];
  const COLOR_OWR = [239, 49, 72, 1];
  const COLOR_OWB_0 = [22, 201, 255, 0];
  const COLOR_OWR_0 = [239, 49, 72, 0];
  const COLOR_OWB_40 = [22, 201, 255, 0.4];
  const COLOR_OWR_40 = [239, 49, 72, 0.4];
  const COLOR_NAVY_56 = [19, 27, 44, 0.56];

  let rafId = 0;
  const state = {
    controls: 0,
    team: 0,
    arc: 0,
    icon: 0
  };

  function updatePartButtonStatuses(values) {
    partButtons.forEach((btn) => {
      const part = btn.dataset.part;
      const status = btn.querySelector('[data-role="status"]');
      if (!part || !status || !(part in values)) {
        return;
      }

      status.textContent = values[part] >= 0.5 ? "Overwatch 2" : "Overwatch 1";
    });
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function lerpRgba(from, to, t) {
    const r = Math.round(lerp(from[0], to[0], t));
    const g = Math.round(lerp(from[1], to[1], t));
    const b = Math.round(lerp(from[2], to[2], t));
    const a = lerp(from[3], to[3], t).toFixed(3);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function applyState(values) {
    const controlsT = values.controls;
    const teamT = values.team;
    const arcT = values.arc;
    const iconT = values.icon;

    const leftStroke = lerpRgba(COLOR_WHITE_56, COLOR_OWB_40, controlsT);
    const rightStroke = lerpRgba(COLOR_WHITE_56, COLOR_OWR_40, controlsT);
    const iconBg = lerpRgba([0, 0, 0, 0], COLOR_NAVY_56, iconT);

    leftDots.forEach((dot) => {
      dot.style.borderColor = leftStroke;
    });

    rightDots.forEach((dot) => {
      dot.style.borderColor = rightStroke;
    });

    teams.forEach((team) => {
      team.style.fontFamily = teamT < 0.5 ? "Koverwatch, sans-serif" : "Poppins, sans-serif";
    });

    teamPanels.forEach((panel) => {
      panel.style.opacity = `${teamT.toFixed(3)}`;
    });

    const topBottomColor = lerpRgba(COLOR_WHITE_36, COLOR_WHITE_40, arcT);
    if (topArc) {
      topArcCrop.style.width = `${lerp(74, 64, arcT)}px`;
      topArcCrop.style.height = `${lerp(74, 12, arcT)}px`;
      topArcCrop.style.top = `${lerp(-13, -12, arcT)}px`;

      topArc.style.width = `${lerp(74, 64, arcT)}px`;
      topArc.style.height = `${lerp(74, 64, arcT)}px`;
      topArc.style.top = `${lerp(37, 36, arcT)}px`;
      topArc.style.borderWidth = "2px";
      topArc.style.borderColor = topBottomColor;
      topArc.style.borderLeftColor = "transparent";
      topArc.style.borderRightColor = "transparent";
      topArc.style.borderBottomColor = "transparent";
      topArc.style.clipPath = "none";
    }

    if (bottomArc) {
      bottomArcCrop.style.width = `${lerp(74, 64, arcT)}px`;
      bottomArcCrop.style.height = `${lerp(74, 12, arcT)}px`;
      bottomArcCrop.style.bottom = `${lerp(-13, -12, arcT)}px`;

      bottomArc.style.width = `${lerp(74, 64, arcT)}px`;
      bottomArc.style.height = `${lerp(74, 64, arcT)}px`;
      bottomArc.style.top = `${lerp(37, -25, arcT)}px`;
      bottomArc.style.borderWidth = "2px";
      bottomArc.style.borderColor = topBottomColor;
      bottomArc.style.borderLeftColor = "transparent";
      bottomArc.style.borderRightColor = "transparent";
      bottomArc.style.borderTopColor = "transparent";
      bottomArc.style.clipPath = "none";
    }

    if (leftArc) {
      leftArc.style.borderWidth = `${lerp(1, 4, arcT)}px`;
      leftArc.style.borderColor = lerpRgba(COLOR_OWB, COLOR_OWB, arcT);
      leftArc.style.clipPath = `inset(${lerp(12, 10, arcT)}px ${lerp(0, 16, arcT)}px ${lerp(12, 10, arcT)}px 0px)`;
      leftArc.style.borderRightColor = "transparent";
      leftArc.style.borderTopColor = lerpRgba(COLOR_OWB_0, COLOR_OWB, arcT);
      leftArc.style.borderBottomColor = lerpRgba(COLOR_OWB_0, COLOR_OWB, arcT);
    }

    if (rightArc) {
      rightArc.style.borderWidth = `${lerp(1, 4, arcT)}px`;
      rightArc.style.borderColor = lerpRgba(COLOR_OWR, COLOR_OWR, arcT);
      rightArc.style.clipPath = `inset(${lerp(12, 10, arcT)}px 0px ${lerp(12, 10, arcT)}px ${lerp(0, 16, arcT)}px)`;
      rightArc.style.borderLeftColor = "transparent";
      rightArc.style.borderTopColor = lerpRgba(COLOR_OWR_0, COLOR_OWR, arcT);
      rightArc.style.borderBottomColor = lerpRgba(COLOR_OWR_0, COLOR_OWR, arcT);
    }

    teamSvgs.forEach((svg, index) => {
      const rightInset = 0;
      const leftInset = lerp(0, 32, teamT);
      const clip = `inset(0px ${rightInset}px 0px ${leftInset}px)`;

      svg.style.clipPath = clip;
      svg.style.webkitClipPath = clip;
    });

    teamBasePaths.forEach(({ path, clipId }) => {
      path.setAttribute("fill-opacity", "1");

      if (teamT < 0.001) {
        path.removeAttribute("clip-path");
        path.removeAttribute("transform");
        return;
      }

      // Match component2 behavior: clipped navy base appears in team state.
      path.setAttribute("clip-path", `url(#${clipId})`);
      path.removeAttribute("transform");
    });

    scores.forEach((score) => {
      score.style.fontSize = `${lerp(20, 12, teamT)}px`;
    });

    if (iconContainer) {
      iconContainer.style.borderWidth = `${lerp(1, 2, iconT)}px`;
      iconContainer.style.borderColor = lerpRgba([255, 255, 255, 0.24], [255, 255, 255, 0.4], iconT);
      iconContainer.style.width = `${lerp(52, 48, iconT)}px`;
      iconContainer.style.height = `${lerp(52, 48, iconT)}px`;
      iconContainer.style.background = "transparent";
    }

    if (lockWrap) {
      lockWrap.style.background = iconBg;
    }

    if (lockIcon) {
      const lockSize = lerp(28, 18, iconT);
      lockIcon.style.width = `${lockSize}px`;
      lockIcon.style.height = `${lockSize}px`;
    }
  }

  function runLerp(nextValues) {
    cancelAnimationFrame(rafId);

    const durationMs = 900;
    const start = performance.now();
    const from = { ...state };
    const to = { ...nextValues };

    function frame(now) {
      const raw = Math.min((now - start) / durationMs, 1);
      const eased = easeInOutCubic(raw);

      const current = {
        controls: lerp(from.controls, to.controls, eased),
        team: lerp(from.team, to.team, eased),
        arc: lerp(from.arc, to.arc, eased),
        icon: lerp(from.icon, to.icon, eased)
      };

      applyState(current);
      updatePartButtonStatuses(current);

      if (raw < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        Object.assign(state, to);
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  animateBtn.addEventListener("click", () => {
    cancelAnimationFrame(rafId);

    const resetState = {
      controls: 0,
      team: 0,
      arc: 0,
      icon: 0
    };

    Object.assign(state, resetState);
    applyState(state);
    updatePartButtonStatuses(state);

    runLerp({
      controls: 1,
      team: 1,
      arc: 1,
      icon: 1
    });
  });

  partButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const part = btn.dataset.part;
      if (!part || !(part in state)) {
        return;
      }

      const next = state[part] < 0.5 ? 1 : 0;
      runLerp({
        ...state,
        [part]: next
      });
    });
  });

  applyState(state);
  updatePartButtonStatuses(state);
}
