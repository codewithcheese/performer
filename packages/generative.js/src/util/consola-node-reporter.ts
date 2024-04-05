import {
  ConsolaOptions,
  ConsolaReporter,
  FormatOptions,
  LogObject,
} from "consola";
import { formatWithOptions } from "node:util";
import { sep } from "node:path";
import supportsColor from "supports-color";

let colors = [6, 2, 3, 4, 5, 1];

if (supportsColor.stderr && supportsColor.stderr.level >= 2) {
  colors = [
    20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68,
    69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134,
    135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
    172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204,
    205, 206, 207, 208, 209, 214, 215, 220, 221,
  ];
}

function selectColor(namespace: string) {
  let hash = 0;

  for (let i = 0; i < namespace.length; i++) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length];
}

function writeStream(data: any, stream: NodeJS.WriteStream) {
  const write = (stream as any).__write || stream.write;
  return write.call(stream, data);
}

function parseStack(stack: string) {
  const cwd = process.cwd() + sep;

  const lines = stack
    .split("\n")
    .splice(1)
    .map((l) => l.trim().replace("file://", "").replace(cwd, ""));

  return lines;
}

const bracket = (x: string) => (x ? `[${x}]` : "");

export class NodeReporter implements ConsolaReporter {
  private colors: Record<string, number> = {};

  formatStack(stack: string, opts: FormatOptions) {
    return "  " + parseStack(stack).join("\n  ");
  }

  formatArgs(args: any[], opts: FormatOptions) {
    const _args = args.map((arg) => {
      if (arg && typeof arg.stack === "string") {
        return arg.message + "\n" + this.formatStack(arg.stack, opts);
      }
      return arg;
    });

    // Only supported with Node >= 10
    // https://nodejs.org/api/util.html#util_util_inspect_object_options
    return formatWithOptions(opts, ..._args);
  }

  formatDate(date: Date, opts: FormatOptions) {
    return opts.date ? date.toLocaleTimeString() : "";
  }

  filterAndJoin(arr: any[]) {
    return arr.filter(Boolean).join(" ");
  }

  formatLogObj(logObj: LogObject, opts: FormatOptions) {
    const message = this.formatArgs(logObj.args, opts);

    if (logObj.type === "box") {
      return (
        "\n" +
        [
          bracket(logObj.tag),
          logObj.title && logObj.title,
          ...message.split("\n"),
        ]
          .filter(Boolean)
          .map((l) => " > " + l)
          .join("\n") +
        "\n"
      );
    }

    const colorCode = logObj.tag ? this.getTagColor(logObj.tag) : 0;
    const tagColor = logObj.tag ? `\x1B[3${colorCode};1m` : "";
    const resetColor = "\x1B[0m";
    const coloredTag = logObj.tag ? tagColor + logObj.tag + resetColor : "";

    return this.filterAndJoin([
      bracket(logObj.type),
      bracket(coloredTag),
      message,
    ]);
  }

  getTagColor(tag: string): number {
    if (!this.colors[tag]) {
      this.colors[tag] = selectColor(tag);
    }
    return this.colors[tag];
  }

  log(logObj: LogObject, ctx: { options: ConsolaOptions }) {
    const line = this.formatLogObj(logObj, {
      columns: (ctx.options.stdout as any).columns || 0,
      ...ctx.options.formatOptions,
    });

    return writeStream(
      line + "\n",
      logObj.level < 2
        ? ctx.options.stderr || process.stderr
        : ctx.options.stdout || process.stdout,
    );
  }
}
