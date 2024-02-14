import { test } from "vitest";
import { create } from "../src/index.js";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";

test("should create performer project", async () => {
  const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), "create-performer-"));

  await create(tmpdir, {
    name: path.basename(path.resolve(tmpdir)),
    template: "default",
    types: "typescript",
  });
});
