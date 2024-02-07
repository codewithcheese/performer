/**
 * Based on https://js.langchain.com/docs/modules/chains/popular/sqlite
 */
import { Assistant, AsyncHooks, createTool, Tool, User } from "@performer/core";
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { z } from "zod";
import * as path from "path";
import sqlite3 from "sqlite3";

sqlite3.verbose();

const SQLSelectSchema = z
  .object({
    query: z.string(),
  })
  .describe(
    "Write a SQLite 3 query to select data that answers the users question.",
  );

export async function App({}, { useResource }: AsyncHooks) {
  const datasource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "Chinook.db"),
  });

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });

  const selectTool = createTool(
    "query_tool",
    SQLSelectSchema,
    async (id, { query }) => {
      const content = await db.run(query);
      return {
        tool_call_id: id,
        role: "tool" as const,
        content: `${content}`,
      };
    },
  );

  const schema = await useResource(() => db.getTableInfo());

  return () => (
    <>
      <system>
        Based on the table schema below, write a SQL query that would answer the
        user's question:
        {schema}
      </system>
      <User />
      <Assistant
        model="gpt-4-1106-preview"
        toolChoice={selectTool}
        tools={[selectTool]}
      />
      <Assistant />
    </>
  );
}
