import { LogObject } from "consola";

const colors = [
  "#0000CC",
  "#0000FF",
  "#0033CC",
  "#0033FF",
  "#0066CC",
  "#0066FF",
  "#0099CC",
  "#0099FF",
  "#00CC00",
  "#00CC33",
  "#00CC66",
  "#00CC99",
  "#00CCCC",
  "#00CCFF",
  "#3300CC",
  "#3300FF",
  "#3333CC",
  "#3333FF",
  "#3366CC",
  "#3366FF",
  "#3399CC",
  "#3399FF",
  "#33CC00",
  "#33CC33",
  "#33CC66",
  "#33CC99",
  "#33CCCC",
  "#33CCFF",
  "#6600CC",
  "#6600FF",
  "#6633CC",
  "#6633FF",
  "#66CC00",
  "#66CC33",
  "#9900CC",
  "#9900FF",
  "#9933CC",
  "#9933FF",
  "#99CC00",
  "#99CC33",
  "#CC0000",
  "#CC0033",
  "#CC0066",
  "#CC0099",
  "#CC00CC",
  "#CC00FF",
  "#CC3300",
  "#CC3333",
  "#CC3366",
  "#CC3399",
  "#CC33CC",
  "#CC33FF",
  "#CC6600",
  "#CC6633",
  "#CC9900",
  "#CC9933",
  "#CCCC00",
  "#CCCC33",
  "#FF0000",
  "#FF0033",
  "#FF0066",
  "#FF0099",
  "#FF00CC",
  "#FF00FF",
  "#FF3300",
  "#FF3333",
  "#FF3366",
  "#FF3399",
  "#FF33CC",
  "#FF33FF",
  "#FF6600",
  "#FF6633",
  "#FF9900",
  "#FF9933",
  "#FFCC00",
  "#FFCC33",
];

export class BrowserReporter {
  options: any;
  tagColors: Record<string, string>;

  constructor(options: any) {
    this.options = { ...options };
    this.tagColors = {};
  }

  _getLogFn(level: number) {
    if (level < 1) {
      return (console as any).__error || console.error;
    }
    if (level === 1) {
      return (console as any).__warn || console.warn;
    }
    return (console as any).__log || console.log;
  }

  log(logObj: LogObject) {
    const consoleLogFn = this._getLogFn(logObj.level);

    // Type
    const type = logObj.type === "log" ? "" : logObj.type;

    // Tag
    const tag = logObj.tag || "";

    // Styles
    let color;
    if (tag) {
      if (!this.tagColors[tag]) {
        this.tagColors[tag] = colors[Math.abs(hash(tag)) % colors.length];
      }
      color = this.tagColors[tag];
    } else {
      color = "#7f8c8d"; // Gray
    }

    const style = `
      background: ${color};
      border-radius: 0.5em;
      color: white;
      font-weight: bold;
      padding: 2px 0.5em;
    `;

    const badge = `%c${[tag, type].filter(Boolean).join(":")}`;

    // Log to the console
    if (typeof logObj.args[0] === "string") {
      consoleLogFn(
        `${badge}%c ${logObj.args[0]}`,
        style,
        // Empty string as style resets to default console style
        "",
        ...logObj.args.slice(1),
      );
    } else {
      consoleLogFn(badge, style, ...logObj.args);
    }
  }
}

function hash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
